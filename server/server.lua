-- Helper: get privy user id from citizenid
local function GetPrivyUserId(citizenid)
    local result = MySQL.query.await('SELECT id FROM privy_users WHERE citizenid = ?', { citizenid })
    if result and result[1] then
        return result[1].id
    end
    return nil
end

-- Helper: get citizenid from server source
local function GetCitizenIdFromSource(source)
    local player = exports.qbx_core:GetPlayer(source)
    if player then
        return player.PlayerData.citizenid
    end
    return nil
end

-- =====================
-- AUTH
-- =====================

RegisterNetEvent("privy:server:login", function(citizenid)
    local src = source
    local user = MySQL.query.await('SELECT * FROM privy_users WHERE citizenid = ?', { citizenid })

    if user and user[1] then
        TriggerClientEvent("privy:client:loginResponse", src, {
            success = true,
            user = user[1]
        })
    else
        TriggerClientEvent("privy:client:loginResponse", src, {
            success = false,
            message = "Account not found. Please register first."
        })
    end
end)

RegisterNetEvent("privy:server:register", function(citizenid, username, displayName)
    local src = source

    -- Check if already registered
    local existing = MySQL.query.await('SELECT id FROM privy_users WHERE citizenid = ? OR username = ?', { citizenid, username })
    if existing and existing[1] then
        TriggerClientEvent("privy:client:registerResponse", src, {
            success = false,
            message = "Account or username already exists."
        })
        return
    end

    local insertId = MySQL.insert.await('INSERT INTO privy_users (citizenid, username, display_name) VALUES (?, ?, ?)', {
        citizenid, username, displayName
    })

    if insertId then
        local user = MySQL.query.await('SELECT * FROM privy_users WHERE id = ?', { insertId })
        TriggerClientEvent("privy:client:registerResponse", src, {
            success = true,
            user = user[1]
        })
    else
        TriggerClientEvent("privy:client:registerResponse", src, {
            success = false,
            message = "Failed to create account."
        })
    end
end)

-- =====================
-- POSTS
-- =====================

RegisterNetEvent("privy:server:getPosts", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    local myUserId = citizenid and GetPrivyUserId(citizenid) or nil

    local posts = MySQL.query.await([[
        SELECT p.*, u.username, u.display_name, u.avatar, u.is_premium,
            (SELECT COUNT(*) FROM privy_likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM privy_comments WHERE post_id = p.id) as comment_count
        FROM privy_posts p
        JOIN privy_users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 50
    ]])

    -- Check which posts the user has liked
    if myUserId and posts then
        for _, post in ipairs(posts) do
            local liked = MySQL.query.await('SELECT id FROM privy_likes WHERE post_id = ? AND user_id = ?', { post.id, myUserId })
            post.isLiked = liked and liked[1] and true or false
        end
    end

    TriggerClientEvent("privy:client:postsResponse", src, posts or {})
end)

RegisterNetEvent("privy:server:createPost", function(content, image)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:createPostResponse", src, { success = false, message = "Not authenticated" })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:createPostResponse", src, { success = false, message = "Privy account not found" })
        return
    end

    local insertId = MySQL.insert.await('INSERT INTO privy_posts (user_id, content, image) VALUES (?, ?, ?)', {
        userId, content, image
    })

    TriggerClientEvent("privy:client:createPostResponse", src, {
        success = insertId ~= nil,
        postId = insertId
    })
end)

RegisterNetEvent("privy:server:likePost", function(postId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:likePostResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:likePostResponse", src, { success = false })
        return
    end

    -- Toggle like
    local existing = MySQL.query.await('SELECT id FROM privy_likes WHERE post_id = ? AND user_id = ?', { postId, userId })
    if existing and existing[1] then
        MySQL.query.await('DELETE FROM privy_likes WHERE post_id = ? AND user_id = ?', { postId, userId })
        MySQL.query.await('UPDATE privy_posts SET likes = GREATEST(likes - 1, 0) WHERE id = ?', { postId })
        TriggerClientEvent("privy:client:likePostResponse", src, { success = true, liked = false })
    else
        MySQL.insert.await('INSERT INTO privy_likes (post_id, user_id) VALUES (?, ?)', { postId, userId })
        MySQL.query.await('UPDATE privy_posts SET likes = likes + 1 WHERE id = ?', { postId })
        TriggerClientEvent("privy:client:likePostResponse", src, { success = true, liked = true })
    end
end)

RegisterNetEvent("privy:server:tipPost", function(postId, amount)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:tipPostResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:tipPostResponse", src, { success = false })
        return
    end

    -- Get post owner
    local post = MySQL.query.await('SELECT user_id FROM privy_posts WHERE id = ?', { postId })
    if not post or not post[1] then
        TriggerClientEvent("privy:client:tipPostResponse", src, { success = false, message = "Post not found" })
        return
    end

    local toUserId = post[1].user_id

    MySQL.insert.await('INSERT INTO privy_tips (from_user_id, to_user_id, post_id, amount) VALUES (?, ?, ?, ?)', {
        userId, toUserId, postId, amount
    })

    TriggerClientEvent("privy:client:tipPostResponse", src, { success = true })
end)

-- =====================
-- PROFILE
-- =====================

RegisterNetEvent("privy:server:getProfile", function(targetUserId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)

    local user
    if targetUserId then
        user = MySQL.query.await('SELECT * FROM privy_users WHERE id = ?', { targetUserId })
    else
        user = MySQL.query.await('SELECT * FROM privy_users WHERE citizenid = ?', { citizenid })
    end

    if user and user[1] then
        local profile = user[1]
        -- Get follower/following counts
        local followers = MySQL.query.await('SELECT COUNT(*) as count FROM privy_followers WHERE following_id = ?', { profile.id })
        local following = MySQL.query.await('SELECT COUNT(*) as count FROM privy_followers WHERE follower_id = ?', { profile.id })
        local postCount = MySQL.query.await('SELECT COUNT(*) as count FROM privy_posts WHERE user_id = ?', { profile.id })

        profile.followerCount = followers and followers[1] and followers[1].count or 0
        profile.followingCount = following and following[1] and following[1].count or 0
        profile.postCount = postCount and postCount[1] and postCount[1].count or 0

        -- Check if current user follows this profile
        if targetUserId then
            local myUserId = GetPrivyUserId(citizenid)
            if myUserId then
                local isFollowing = MySQL.query.await('SELECT id FROM privy_followers WHERE follower_id = ? AND following_id = ?', { myUserId, profile.id })
                profile.isFollowing = isFollowing and isFollowing[1] and true or false
            end
        end

        -- Get user posts
        local posts = MySQL.query.await('SELECT * FROM privy_posts WHERE user_id = ? ORDER BY created_at DESC', { profile.id })
        profile.posts = posts or {}

        TriggerClientEvent("privy:client:profileResponse", src, { success = true, profile = profile })
    else
        TriggerClientEvent("privy:client:profileResponse", src, { success = false, message = "Profile not found" })
    end
end)

RegisterNetEvent("privy:server:updateProfile", function(data)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:updateProfileResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:updateProfileResponse", src, { success = false })
        return
    end

    MySQL.query.await([[
        UPDATE privy_users
        SET display_name = ?, username = ?, bio = ?, is_premium = ?, price = ?, avatar = ?, banner = ?
        WHERE id = ?
    ]], {
        data.displayName or data.display_name,
        data.username,
        data.bio,
        data.isPremium and 1 or 0,
        data.price or 0,
        data.avatar,
        data.banner,
        userId
    })

    TriggerClientEvent("privy:client:updateProfileResponse", src, { success = true })
end)

-- =====================
-- MESSAGES
-- =====================

RegisterNetEvent("privy:server:getMessages", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:messagesResponse", src, {})
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:messagesResponse", src, {})
        return
    end

    -- Get latest message per conversation
    local threads = MySQL.query.await([[
        SELECT m.*, u.username, u.display_name, u.avatar,
            (SELECT COUNT(*) FROM privy_messages WHERE sender_id = other_user.id AND receiver_id = ? AND is_read = 0) as unread_count
        FROM privy_messages m
        JOIN privy_users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
        LEFT JOIN privy_users other_user ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = other_user.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        AND m.id IN (
            SELECT MAX(id) FROM privy_messages
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
        )
        ORDER BY m.created_at DESC
    ]], { userId, userId, userId, userId, userId, userId, userId })

    TriggerClientEvent("privy:client:messagesResponse", src, threads or {})
end)

RegisterNetEvent("privy:server:sendMessage", function(receiverId, content)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:sendMessageResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:sendMessageResponse", src, { success = false })
        return
    end

    local insertId = MySQL.insert.await('INSERT INTO privy_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', {
        userId, receiverId, content
    })

    TriggerClientEvent("privy:client:sendMessageResponse", src, {
        success = insertId ~= nil,
        messageId = insertId
    })
end)

-- =====================
-- DISCOVERY
-- =====================

RegisterNetEvent("privy:server:discover", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    local myUserId = citizenid and GetPrivyUserId(citizenid) or nil

    -- Get suggested users (excluding self)
    local users
    if myUserId then
        users = MySQL.query.await([[
            SELECT u.*,
                (SELECT COUNT(*) FROM privy_followers WHERE following_id = u.id) as follower_count,
                (SELECT COUNT(*) FROM privy_posts WHERE user_id = u.id) as post_count
            FROM privy_users u
            WHERE u.id != ?
            ORDER BY follower_count DESC
            LIMIT 20
        ]], { myUserId })
    else
        users = MySQL.query.await([[
            SELECT u.*,
                (SELECT COUNT(*) FROM privy_followers WHERE following_id = u.id) as follower_count,
                (SELECT COUNT(*) FROM privy_posts WHERE user_id = u.id) as post_count
            FROM privy_users u
            ORDER BY follower_count DESC
            LIMIT 20
        ]])
    end

    TriggerClientEvent("privy:client:discoverResponse", src, users or {})
end)

RegisterNetEvent("privy:server:followUser", function(targetUserId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:followUserResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:followUserResponse", src, { success = false })
        return
    end

    -- Toggle follow
    local existing = MySQL.query.await('SELECT id FROM privy_followers WHERE follower_id = ? AND following_id = ?', { userId, targetUserId })
    if existing and existing[1] then
        MySQL.query.await('DELETE FROM privy_followers WHERE follower_id = ? AND following_id = ?', { userId, targetUserId })
        TriggerClientEvent("privy:client:followUserResponse", src, { success = true, following = false })
    else
        MySQL.insert.await('INSERT INTO privy_followers (follower_id, following_id) VALUES (?, ?)', { userId, targetUserId })
        TriggerClientEvent("privy:client:followUserResponse", src, { success = true, following = true })
    end
end)
