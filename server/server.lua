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

-- Helper: get blocked user ids for a user
local function GetBlockedIds(userId)
    local blocked = MySQL.query.await('SELECT blocked_id FROM privy_blocks WHERE blocker_id = ?', { userId })
    local ids = {}
    if blocked then
        for _, row in ipairs(blocked) do
            ids[row.blocked_id] = true
        end
    end
    return ids
end

-- Helper: get users who blocked this user
local function GetBlockedByIds(userId)
    local blockers = MySQL.query.await('SELECT blocker_id FROM privy_blocks WHERE blocked_id = ?', { userId })
    local ids = {}
    if blockers then
        for _, row in ipairs(blockers) do
            ids[row.blocker_id] = true
        end
    end
    return ids
end

-- Helper: get online player source from privy user id
local function GetSourceFromPrivyUserId(privyUserId)
    local row = MySQL.query.await('SELECT citizenid FROM privy_users WHERE id = ?', { privyUserId })
    if not row or not row[1] then return nil end
    local citizenid = row[1].citizenid

    local players = exports.qbx_core:GetQBPlayers()
    if players then
        for src, player in pairs(players) do
            if player and player.PlayerData and player.PlayerData.citizenid == citizenid then
                return src
            end
        end
    end
    return nil
end

-- Helper: check if user has active subscription to a creator
local function HasActiveSubscription(subscriberId, creatorId)
    local sub = MySQL.query.await(
        'SELECT id FROM privy_subscriptions WHERE subscriber_id = ? AND creator_id = ? AND expires_at > NOW()',
        { subscriberId, creatorId }
    )
    return sub and sub[1] and true or false
end

-- Helper: decode JSON images field
local function DecodeImages(imagesJson)
    if not imagesJson or imagesJson == '' then
        return nil
    end
    local ok, decoded = pcall(json.decode, imagesJson)
    if ok and type(decoded) == 'table' then
        return decoded
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

    -- Get blocked ids to filter out
    local blockedIds = myUserId and GetBlockedIds(myUserId) or {}
    local blockedByIds = myUserId and GetBlockedByIds(myUserId) or {}

    local posts = MySQL.query.await([[
        SELECT p.*, u.username, u.display_name, u.avatar, u.is_premium,
            (SELECT COUNT(*) FROM privy_likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM privy_comments WHERE post_id = p.id) as comment_count
        FROM privy_posts p
        JOIN privy_users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 50
    ]])

    local filtered = {}
    if posts then
        for _, post in ipairs(posts) do
            -- Skip posts from blocked users
            if not blockedIds[post.user_id] and not blockedByIds[post.user_id] then
                -- Filter out premium posts from creators the viewer is not subscribed to
                if post.visibility == 'premium' and post.user_id ~= myUserId then
                    if not HasActiveSubscription(myUserId, post.user_id) then
                        goto continue
                    end
                end

                -- Check if user liked this post
                if myUserId then
                    local liked = MySQL.query.await('SELECT id FROM privy_likes WHERE post_id = ? AND user_id = ?', { post.id, myUserId })
                    post.isLiked = liked and liked[1] and true or false
                end

                -- Decode images JSON
                post.images = DecodeImages(post.images)

                table.insert(filtered, post)
            end
            ::continue::
        end
    end

    TriggerClientEvent("privy:client:postsResponse", src, filtered)
end)

RegisterNetEvent("privy:server:getPost", function(postId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    local myUserId = citizenid and GetPrivyUserId(citizenid) or nil

    local posts = MySQL.query.await([[
        SELECT p.*, u.username, u.display_name, u.avatar, u.is_premium,
            (SELECT COUNT(*) FROM privy_likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM privy_comments WHERE post_id = p.id) as comment_count
        FROM privy_posts p
        JOIN privy_users u ON p.user_id = u.id
        WHERE p.id = ?
    ]], { postId })

    if posts and posts[1] then
        local post = posts[1]
        if myUserId then
            local liked = MySQL.query.await('SELECT id FROM privy_likes WHERE post_id = ? AND user_id = ?', { post.id, myUserId })
            post.isLiked = liked and liked[1] and true or false
        end
        post.images = DecodeImages(post.images)
        TriggerClientEvent("privy:client:getPostResponse", src, post)
    else
        TriggerClientEvent("privy:client:getPostResponse", src, nil)
    end
end)

RegisterNetEvent("privy:server:createPost", function(content, image, images, visibility)
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

    -- Encode images array as JSON
    local imagesJson = nil
    if images and type(images) == 'table' and #images > 0 then
        imagesJson = json.encode(images)
    end

    local insertId = MySQL.insert.await(
        'INSERT INTO privy_posts (user_id, content, image, images, visibility) VALUES (?, ?, ?, ?, ?)',
        { userId, content, image, imagesJson, visibility or 'free' }
    )

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

        -- Create notification for post owner
        local post = MySQL.query.await('SELECT user_id FROM privy_posts WHERE id = ?', { postId })
        if post and post[1] and post[1].user_id ~= userId then
            MySQL.insert.await('INSERT INTO privy_notifications (user_id, from_user_id, type, text, post_id) VALUES (?, ?, ?, ?, ?)', {
                post[1].user_id, userId, 'like', 'liked your post', postId
            })
        end

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

    -- Credit creator's wallet with tip amount (as cash)
    MySQL.query.await('INSERT INTO privy_wallet (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id', { toUserId })
    MySQL.query.await('UPDATE privy_wallet SET cash_balance = cash_balance + ? WHERE user_id = ?', { amount, toUserId })

    -- Create notification for post owner
    if toUserId ~= userId then
        MySQL.insert.await('INSERT INTO privy_notifications (user_id, from_user_id, type, text, post_id) VALUES (?, ?, ?, ?, ?)', {
            toUserId, userId, 'tip', 'sent you a $' .. tostring(amount) .. ' tip', postId
        })
    end

    TriggerClientEvent("privy:client:tipPostResponse", src, { success = true })
end)

-- =====================
-- COMMENTS
-- =====================

RegisterNetEvent("privy:server:getComments", function(postId)
    local src = source

    local comments = MySQL.query.await([[
        SELECT c.*, u.username, u.display_name, u.avatar
        FROM privy_comments c
        JOIN privy_users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
        LIMIT 100
    ]], { postId })

    TriggerClientEvent("privy:client:commentsResponse", src, comments or {})
end)

RegisterNetEvent("privy:server:addComment", function(postId, content)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:addCommentResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:addCommentResponse", src, { success = false })
        return
    end

    local insertId = MySQL.insert.await(
        'INSERT INTO privy_comments (post_id, user_id, content) VALUES (?, ?, ?)',
        { postId, userId, content }
    )

    if insertId then
        local user = MySQL.query.await('SELECT username, display_name, avatar FROM privy_users WHERE id = ?', { userId })
        local u = user and user[1] or {}

        -- Create notification for post owner
        local post = MySQL.query.await('SELECT user_id FROM privy_posts WHERE id = ?', { postId })
        if post and post[1] and post[1].user_id ~= userId then
            local previewText = content and content:sub(1, 50) or ''
            MySQL.insert.await('INSERT INTO privy_notifications (user_id, from_user_id, type, text, post_id) VALUES (?, ?, ?, ?, ?)', {
                post[1].user_id, userId, 'comment', 'commented: "' .. previewText .. '"', postId
            })
        end

        TriggerClientEvent("privy:client:addCommentResponse", src, {
            success = true,
            commentId = insertId,
            user_id = userId,
            username = u.username,
            display_name = u.display_name,
            avatar = u.avatar
        })
    else
        TriggerClientEvent("privy:client:addCommentResponse", src, { success = false })
    end
end)

RegisterNetEvent("privy:server:getLikedPosts", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:likedPostsResponse", src, {})
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:likedPostsResponse", src, {})
        return
    end

    local posts = MySQL.query.await([[
        SELECT p.*, u.username, u.display_name, u.avatar, u.is_premium,
            (SELECT COUNT(*) FROM privy_likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM privy_comments WHERE post_id = p.id) as comment_count
        FROM privy_likes l
        JOIN privy_posts p ON l.post_id = p.id
        JOIN privy_users u ON p.user_id = u.id
        WHERE l.user_id = ?
        ORDER BY l.id DESC
        LIMIT 50
    ]], { userId })

    if posts then
        for _, post in ipairs(posts) do
            post.images = DecodeImages(post.images)
            post.isLiked = true
        end
    end

    TriggerClientEvent("privy:client:likedPostsResponse", src, posts or {})
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
        local myUserId = citizenid and GetPrivyUserId(citizenid) or nil
        if targetUserId and myUserId then
            local isFollowing = MySQL.query.await('SELECT id FROM privy_followers WHERE follower_id = ? AND following_id = ?', { myUserId, profile.id })
            profile.isFollowing = isFollowing and isFollowing[1] and true or false

            -- Check subscription status
            profile.isSubscribed = HasActiveSubscription(myUserId, profile.id)
        end

        -- Get user posts with images
        local posts = MySQL.query.await('SELECT * FROM privy_posts WHERE user_id = ? ORDER BY created_at DESC', { profile.id })
        if posts then
            for _, post in ipairs(posts) do
                post.images = DecodeImages(post.images)
            end
        end
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

    local isPremium = 0
    if data.isPremium == true or data.isPremium == 1 or data.isPremium == "true" then
        isPremium = 1
    end

    MySQL.query.await([[
        UPDATE privy_users
        SET display_name = ?, username = ?, bio = ?, is_premium = ?, price = ?, payment_currency = ?, avatar = ?, banner = ?
        WHERE id = ?
    ]], {
        data.displayName or data.display_name,
        data.username,
        data.bio,
        isPremium,
        tonumber(data.price) or 0,
        data.paymentCurrency or 'cash',
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
        SELECT m.*,
            (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) as other_user_id,
            u.username, u.display_name, u.avatar,
            (SELECT COUNT(*) FROM privy_messages WHERE sender_id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) AND receiver_id = ? AND is_read = 0) as unread_count
        FROM privy_messages m
        JOIN privy_users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
        WHERE (m.sender_id = ? OR m.receiver_id = ?)
        AND m.id IN (
            SELECT MAX(id) FROM privy_messages
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
        )
        ORDER BY m.created_at DESC
    ]], { userId, userId, userId, userId, userId, userId, userId, userId })

    TriggerClientEvent("privy:client:messagesResponse", src, threads or {})
end)

RegisterNetEvent("privy:server:getChatMessages", function(otherUserId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:chatMessagesResponse", src, {})
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:chatMessagesResponse", src, {})
        return
    end

    -- Get all messages between the two users
    local messages = MySQL.query.await([[
        SELECT m.*,
            sender.username as sender_username, sender.display_name as sender_display_name, sender.avatar as sender_avatar,
            receiver.username as receiver_username, receiver.display_name as receiver_display_name, receiver.avatar as receiver_avatar
        FROM privy_messages m
        JOIN privy_users sender ON m.sender_id = sender.id
        JOIN privy_users receiver ON m.receiver_id = receiver.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
        LIMIT 100
    ]], { userId, otherUserId, otherUserId, userId })

    -- Mark received messages as read
    MySQL.query.await('UPDATE privy_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', {
        otherUserId, userId
    })

    -- Add isMine flag for each message
    if messages then
        for _, msg in ipairs(messages) do
            msg.isMine = msg.sender_id == userId
        end
    end

    TriggerClientEvent("privy:client:chatMessagesResponse", src, messages or {})
end)

RegisterNetEvent("privy:server:sendMessage", function(receiverId, content, msgType)
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

    local insertId = MySQL.insert.await(
        'INSERT INTO privy_messages (sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?)',
        { userId, receiverId, content, msgType or 'text' }
    )

    TriggerClientEvent("privy:client:sendMessageResponse", src, {
        success = insertId ~= nil,
        messageId = insertId
    })

    -- Notify receiver in real-time
    if insertId then
        local receiverSrc = GetSourceFromPrivyUserId(receiverId)
        if receiverSrc then
            local sender = MySQL.query.await('SELECT username, display_name, avatar FROM privy_users WHERE id = ?', { userId })
            local s = sender and sender[1] or {}
            TriggerClientEvent("privy:client:newMessage", receiverSrc, {
                id = insertId,
                sender_id = userId,
                sender_name = s.display_name or s.username or 'Unknown',
                sender_avatar = s.avatar or '',
                content = content,
                type = msgType or 'text',
                created_at = os.date('%Y-%m-%d %H:%M:%S')
            })
        end
    end
end)

RegisterNetEvent("privy:server:sendMediaMessage", function(receiverId, mediaType, mediaUrl)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:sendMediaMessageResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:sendMediaMessageResponse", src, { success = false })
        return
    end

    local insertId = MySQL.insert.await(
        'INSERT INTO privy_messages (sender_id, receiver_id, content, type, media_url) VALUES (?, ?, ?, ?, ?)',
        { userId, receiverId, '', mediaType or 'image', mediaUrl }
    )

    TriggerClientEvent("privy:client:sendMediaMessageResponse", src, {
        success = insertId ~= nil,
        messageId = insertId
    })

    -- Notify receiver in real-time
    if insertId then
        local receiverSrc = GetSourceFromPrivyUserId(receiverId)
        if receiverSrc then
            local sender = MySQL.query.await('SELECT username, display_name, avatar FROM privy_users WHERE id = ?', { userId })
            local s = sender and sender[1] or {}
            TriggerClientEvent("privy:client:newMessage", receiverSrc, {
                id = insertId,
                sender_id = userId,
                sender_name = s.display_name or s.username or 'Unknown',
                sender_avatar = s.avatar or '',
                content = '',
                type = mediaType or 'image',
                media_url = mediaUrl,
                created_at = os.date('%Y-%m-%d %H:%M:%S')
            })
        end
    end
end)

RegisterNetEvent("privy:server:sendPayment", function(receiverId, amount, note)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:sendPaymentResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:sendPaymentResponse", src, { success = false })
        return
    end

    local numAmount = tonumber(amount) or 0
    if numAmount <= 0 then
        TriggerClientEvent("privy:client:sendPaymentResponse", src, { success = false, message = "Invalid amount" })
        return
    end

    -- Deduct money from sender
    local player = exports.qbx_core:GetPlayer(src)
    if not player then
        TriggerClientEvent("privy:client:sendPaymentResponse", src, { success = false, message = "Player not found" })
        return
    end

    local cash = player.PlayerData.money['cash'] or 0
    local bank = player.PlayerData.money['bank'] or 0
    if cash >= numAmount then
        player.Functions.RemoveMoney('cash', numAmount, 'privy-payment')
    elseif bank >= numAmount then
        player.Functions.RemoveMoney('bank', numAmount, 'privy-payment')
    else
        TriggerClientEvent("privy:client:sendPaymentResponse", src, { success = false, message = "Insufficient funds" })
        return
    end

    -- Record as a tip
    MySQL.insert.await('INSERT INTO privy_tips (from_user_id, to_user_id, amount) VALUES (?, ?, ?)', {
        userId, receiverId, numAmount
    })

    -- Credit receiver's wallet
    MySQL.query.await('INSERT INTO privy_wallet (user_id, cash_balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE cash_balance = cash_balance + ?', {
        receiverId, numAmount, numAmount
    })

    -- Record as a payment message
    local insertId = MySQL.insert.await(
        'INSERT INTO privy_messages (sender_id, receiver_id, content, type, amount) VALUES (?, ?, ?, ?, ?)',
        { userId, receiverId, note or '', 'payment', numAmount }
    )

    TriggerClientEvent("privy:client:sendPaymentResponse", src, {
        success = insertId ~= nil,
        messageId = insertId
    })

    -- Notify receiver in real-time
    if insertId then
        local receiverSrc = GetSourceFromPrivyUserId(receiverId)
        if receiverSrc then
            local sender = MySQL.query.await('SELECT username, display_name, avatar FROM privy_users WHERE id = ?', { userId })
            local s = sender and sender[1] or {}
            TriggerClientEvent("privy:client:newMessage", receiverSrc, {
                id = insertId,
                sender_id = userId,
                sender_name = s.display_name or s.username or 'Unknown',
                sender_avatar = s.avatar or '',
                content = note or '',
                type = 'payment',
                amount = amount,
                created_at = os.date('%Y-%m-%d %H:%M:%S')
            })
        end
    end
end)

-- =====================
-- DISCOVERY
-- =====================

RegisterNetEvent("privy:server:discover", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    local myUserId = citizenid and GetPrivyUserId(citizenid) or nil

    -- Get blocked ids to exclude
    local blockedIds = myUserId and GetBlockedIds(myUserId) or {}
    local blockedByIds = myUserId and GetBlockedByIds(myUserId) or {}

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

    -- Filter out blocked users
    local filtered = {}
    if users then
        for _, user in ipairs(users) do
            if not blockedIds[user.id] and not blockedByIds[user.id] then
                table.insert(filtered, user)
            end
        end
    end

    TriggerClientEvent("privy:client:discoverResponse", src, filtered)
end)

RegisterNetEvent("privy:server:searchUsers", function(query)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    local myUserId = citizenid and GetPrivyUserId(citizenid) or nil

    if not query or query == '' then
        TriggerClientEvent("privy:client:searchUsersResponse", src, {})
        return
    end

    local searchPattern = '%' .. query .. '%'

    local blockedIds = myUserId and GetBlockedIds(myUserId) or {}
    local blockedByIds = myUserId and GetBlockedByIds(myUserId) or {}

    local users
    if myUserId then
        users = MySQL.query.await([[
            SELECT u.id, u.username, u.display_name, u.avatar, u.is_premium,
                (SELECT COUNT(*) FROM privy_followers WHERE following_id = u.id) as follower_count
            FROM privy_users u
            WHERE u.id != ? AND (u.username LIKE ? OR u.display_name LIKE ?)
            ORDER BY follower_count DESC
            LIMIT 20
        ]], { myUserId, searchPattern, searchPattern })
    else
        users = MySQL.query.await([[
            SELECT u.id, u.username, u.display_name, u.avatar, u.is_premium,
                (SELECT COUNT(*) FROM privy_followers WHERE following_id = u.id) as follower_count
            FROM privy_users u
            WHERE u.username LIKE ? OR u.display_name LIKE ?
            ORDER BY follower_count DESC
            LIMIT 20
        ]], { searchPattern, searchPattern })
    end

    local filtered = {}
    if users then
        for _, user in ipairs(users) do
            if not blockedIds[user.id] and not blockedByIds[user.id] then
                table.insert(filtered, user)
            end
        end
    end

    TriggerClientEvent("privy:client:searchUsersResponse", src, filtered)
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

        -- Create notification for followed user
        MySQL.insert.await('INSERT INTO privy_notifications (user_id, from_user_id, type, text) VALUES (?, ?, ?, ?)', {
            targetUserId, userId, 'follow', 'started following you'
        })

        TriggerClientEvent("privy:client:followUserResponse", src, { success = true, following = true })
    end
end)

-- =====================
-- STORIES
-- =====================

RegisterNetEvent("privy:server:createStory", function(mediaUrl, caption, mediaType)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:createStoryResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:createStoryResponse", src, { success = false })
        return
    end

    local insertId = MySQL.insert.await(
        'INSERT INTO privy_stories (user_id, media_url, caption) VALUES (?, ?, ?)',
        { userId, mediaUrl, caption }
    )

    TriggerClientEvent("privy:client:createStoryResponse", src, {
        success = insertId ~= nil,
        storyId = insertId
    })
end)

RegisterNetEvent("privy:server:getStories", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    local myUserId = citizenid and GetPrivyUserId(citizenid) or nil

    local blockedIds = myUserId and GetBlockedIds(myUserId) or {}
    local blockedByIds = myUserId and GetBlockedByIds(myUserId) or {}

    -- Get active stories (not expired), grouped by user
    local stories = MySQL.query.await([[
        SELECT s.*, u.username, u.display_name, u.avatar, u.is_premium
        FROM privy_stories s
        JOIN privy_users u ON s.user_id = u.id
        WHERE s.expires_at > NOW()
        ORDER BY s.user_id, s.created_at ASC
    ]])

    -- Group by user and filter blocked
    local grouped = {}
    local userOrder = {}
    if stories then
        for _, story in ipairs(stories) do
            if not blockedIds[story.user_id] and not blockedByIds[story.user_id] then
                if not grouped[story.user_id] then
                    grouped[story.user_id] = {
                        user = {
                            id = story.user_id,
                            username = story.username,
                            displayName = story.display_name,
                            avatar = story.avatar,
                            isVerified = story.is_premium == 1
                        },
                        items = {}
                    }
                    table.insert(userOrder, story.user_id)
                end
                table.insert(grouped[story.user_id].items, {
                    id = tostring(story.id),
                    image = story.media_url,
                    caption = story.caption,
                    timestamp = story.created_at
                })
            end
        end
    end

    -- Build result array preserving order
    local result = {}
    for _, uid in ipairs(userOrder) do
        table.insert(result, grouped[uid])
    end

    TriggerClientEvent("privy:client:storiesResponse", src, result)
end)

-- =====================
-- MY STORIES / MY POSTS / DELETE
-- =====================

RegisterNetEvent("privy:server:getMyStories", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:myStoriesResponse", src, { items = {} })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:myStoriesResponse", src, { items = {} })
        return
    end

    local stories = MySQL.query.await([[
        SELECT id, media_url, caption, created_at
        FROM privy_stories
        WHERE user_id = ? AND expires_at > NOW()
        ORDER BY created_at ASC
    ]], { userId })

    TriggerClientEvent("privy:client:myStoriesResponse", src, { items = stories or {} })
end)

RegisterNetEvent("privy:server:getMyPosts", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:myPostsResponse", src, {})
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:myPostsResponse", src, {})
        return
    end

    local posts = MySQL.query.await([[
        SELECT p.*, u.username, u.display_name, u.avatar, u.is_premium,
            (SELECT COUNT(*) FROM privy_likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM privy_comments WHERE post_id = p.id) as comment_count
        FROM privy_posts p
        JOIN privy_users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT 50
    ]], { userId })

    if posts then
        for _, post in ipairs(posts) do
            post.images = DecodeImages(post.images)
        end
    end

    TriggerClientEvent("privy:client:myPostsResponse", src, posts or {})
end)

RegisterNetEvent("privy:server:deleteStory", function(storyId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:deleteStoryResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:deleteStoryResponse", src, { success = false })
        return
    end

    -- Only delete if the story belongs to this user
    MySQL.query.await('DELETE FROM privy_stories WHERE id = ? AND user_id = ?', { storyId, userId })

    TriggerClientEvent("privy:client:deleteStoryResponse", src, { success = true })
end)

RegisterNetEvent("privy:server:deletePost", function(postId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:deletePostResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:deletePostResponse", src, { success = false })
        return
    end

    -- Only delete if the post belongs to this user
    -- Also clean up related likes and comments
    MySQL.query.await('DELETE FROM privy_likes WHERE post_id = ? AND EXISTS (SELECT 1 FROM privy_posts WHERE id = ? AND user_id = ?)', { postId, postId, userId })
    MySQL.query.await('DELETE FROM privy_comments WHERE post_id = ? AND EXISTS (SELECT 1 FROM privy_posts WHERE id = ? AND user_id = ?)', { postId, postId, userId })
    MySQL.query.await('DELETE FROM privy_posts WHERE id = ? AND user_id = ?', { postId, userId })

    TriggerClientEvent("privy:client:deletePostResponse", src, { success = true })
end)

-- =====================
-- BLOCK / UNBLOCK
-- =====================

RegisterNetEvent("privy:server:blockUser", function(targetUserId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:blockUserResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:blockUserResponse", src, { success = false })
        return
    end

    -- Resolve target user id (could be privy user id or we need to look it up)
    local targetId = tonumber(targetUserId)
    if not targetId then
        TriggerClientEvent("privy:client:blockUserResponse", src, { success = false })
        return
    end

    -- Insert block (ignore if already blocked)
    MySQL.query.await('INSERT IGNORE INTO privy_blocks (blocker_id, blocked_id) VALUES (?, ?)', { userId, targetId })

    -- Also unfollow in both directions
    MySQL.query.await('DELETE FROM privy_followers WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)', {
        userId, targetId, targetId, userId
    })

    TriggerClientEvent("privy:client:blockUserResponse", src, { success = true })
end)

RegisterNetEvent("privy:server:unblockUser", function(targetUserId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:unblockUserResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:unblockUserResponse", src, { success = false })
        return
    end

    local targetId = tonumber(targetUserId)
    if not targetId then
        TriggerClientEvent("privy:client:unblockUserResponse", src, { success = false })
        return
    end

    MySQL.query.await('DELETE FROM privy_blocks WHERE blocker_id = ? AND blocked_id = ?', { userId, targetId })

    TriggerClientEvent("privy:client:unblockUserResponse", src, { success = true })
end)

RegisterNetEvent("privy:server:getBlockedUsers", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:blockedUsersResponse", src, {})
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:blockedUsersResponse", src, {})
        return
    end

    local blocked = MySQL.query.await([[
        SELECT u.id, u.username, u.display_name, u.avatar, b.created_at as blocked_at
        FROM privy_blocks b
        JOIN privy_users u ON b.blocked_id = u.id
        WHERE b.blocker_id = ?
        ORDER BY b.created_at DESC
    ]], { userId })

    TriggerClientEvent("privy:client:blockedUsersResponse", src, blocked or {})
end)

-- =====================
-- REPORTS
-- =====================

RegisterNetEvent("privy:server:reportPost", function(postId, reportedUserId, reason)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:reportPostResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:reportPostResponse", src, { success = false })
        return
    end

    local insertId = MySQL.insert.await(
        'INSERT INTO privy_reports (reporter_id, reported_user_id, post_id, reason) VALUES (?, ?, ?, ?)',
        { userId, reportedUserId, postId, reason or 'Reported by user' }
    )

    TriggerClientEvent("privy:client:reportPostResponse", src, {
        success = insertId ~= nil
    })
end)

-- =====================
-- WALLET
-- =====================

RegisterNetEvent("privy:server:getWallet", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:walletResponse", src, { cashBalance = 0, prismaBalance = 0 })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:walletResponse", src, { cashBalance = 0, prismaBalance = 0 })
        return
    end

    -- Ensure wallet row exists
    MySQL.query.await('INSERT IGNORE INTO privy_wallet (user_id) VALUES (?)', { userId })

    local wallet = MySQL.query.await('SELECT cash_balance, prisma_balance FROM privy_wallet WHERE user_id = ?', { userId })

    if wallet and wallet[1] then
        TriggerClientEvent("privy:client:walletResponse", src, {
            cashBalance = wallet[1].cash_balance or 0,
            prismaBalance = wallet[1].prisma_balance or 0
        })
    else
        TriggerClientEvent("privy:client:walletResponse", src, { cashBalance = 0, prismaBalance = 0 })
    end
end)

RegisterNetEvent("privy:server:withdrawWallet", function(currency, amount)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:withdrawWalletResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:withdrawWalletResponse", src, { success = false })
        return
    end

    local player = exports.qbx_core:GetPlayer(src)
    if not player then
        TriggerClientEvent("privy:client:withdrawWalletResponse", src, { success = false })
        return
    end

    if currency == 'cash' then
        local wallet = MySQL.query.await('SELECT cash_balance FROM privy_wallet WHERE user_id = ?', { userId })
        local balance = tonumber(wallet and wallet[1] and wallet[1].cash_balance) or 0
        if balance <= 0 then
            TriggerClientEvent("privy:client:withdrawWalletResponse", src, { success = false, message = "No balance" })
            return
        end
        -- Apply 10% fee
        local fee = balance * 0.10
        local netAmount = balance - fee
        -- Give net amount to player
        player.Functions.AddMoney('money', netAmount)
        -- Reset wallet balance
        MySQL.query.await('UPDATE privy_wallet SET cash_balance = 0 WHERE user_id = ?', { userId })
        TriggerClientEvent("privy:client:withdrawWalletResponse", src, { success = true, amount = netAmount, currency = 'cash' })
    elseif currency == 'prismas' then
        local wallet = MySQL.query.await('SELECT prisma_balance FROM privy_wallet WHERE user_id = ?', { userId })
        local balance = tonumber(wallet and wallet[1] and wallet[1].prisma_balance) or 0
        if balance <= 0 then
            TriggerClientEvent("privy:client:withdrawWalletResponse", src, { success = false, message = "No balance" })
            return
        end
        -- Apply 10% fee
        local fee = math.floor(balance * 0.10)
        local netAmount = balance - fee
        -- Give net amount to player
        player.Functions.AddMoney('prima', netAmount)
        -- Reset wallet balance
        MySQL.query.await('UPDATE privy_wallet SET prisma_balance = 0 WHERE user_id = ?', { userId })
        TriggerClientEvent("privy:client:withdrawWalletResponse", src, { success = true, amount = netAmount, currency = 'prismas' })
    else
        TriggerClientEvent("privy:client:withdrawWalletResponse", src, { success = false, message = "Invalid currency" })
    end
end)

-- =====================
-- NOTIFICATIONS
-- =====================

RegisterNetEvent("privy:server:getNotifications", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:notificationsResponse", src, {})
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:notificationsResponse", src, {})
        return
    end

    local notifs = MySQL.query.await([[
        SELECT n.id, n.type, n.text, n.is_read, n.created_at, n.post_id,
            u.id as from_user_id, u.username as from_username, u.display_name as from_display_name, u.avatar as from_avatar
        FROM privy_notifications n
        JOIN privy_users u ON n.from_user_id = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
    ]], { userId })

    TriggerClientEvent("privy:client:notificationsResponse", src, notifs or {})
end)

RegisterNetEvent("privy:server:markNotificationsRead", function()
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:markNotificationsReadResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:markNotificationsReadResponse", src, { success = false })
        return
    end

    MySQL.query.await('UPDATE privy_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', { userId })

    TriggerClientEvent("privy:client:markNotificationsReadResponse", src, { success = true })
end)

-- =====================
-- SUBSCRIPTIONS
-- =====================

RegisterNetEvent("privy:server:subscribe", function(creatorId)
    local src = source
    local citizenid = GetCitizenIdFromSource(src)
    if not citizenid then
        TriggerClientEvent("privy:client:subscribeResponse", src, { success = false })
        return
    end

    local userId = GetPrivyUserId(citizenid)
    if not userId then
        TriggerClientEvent("privy:client:subscribeResponse", src, { success = false })
        return
    end

    -- Get creator's subscription price and currency
    local creator = MySQL.query.await('SELECT id, price, payment_currency FROM privy_users WHERE id = ?', { creatorId })
    if not creator or not creator[1] then
        TriggerClientEvent("privy:client:subscribeResponse", src, { success = false, message = "Creator not found" })
        return
    end

    local price = creator[1].price
    local currency = creator[1].payment_currency

    -- Check if already subscribed
    if HasActiveSubscription(userId, creatorId) then
        TriggerClientEvent("privy:client:subscribeResponse", src, { success = false, message = "Already subscribed" })
        return
    end

    -- TODO: Deduct money from player based on currency (cash or diamonds)
    -- This would integrate with your economy system, e.g.:
    if currency == 'cash' then
        local player = exports.qbx_core:GetPlayer(src)
        -- if player.PlayerData.money.cash < price then ... end
        player.Functions.RemoveMoney('money', price)
    elseif currency == 'prismas' then
        player.Functions.RemoveMoney('prisma', price)
    end

    -- Insert or update subscription (7-day weekly)
    MySQL.query.await([[
        INSERT INTO privy_subscriptions (subscriber_id, creator_id, price, currency, expires_at)
        VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
        ON DUPLICATE KEY UPDATE
            price = VALUES(price),
            currency = VALUES(currency),
            expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
    ]], { userId, creatorId, price, currency })

    -- Credit creator's wallet
    MySQL.query.await('INSERT INTO privy_wallet (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id', { creatorId })
    if currency == 'cash' then
        MySQL.query.await('UPDATE privy_wallet SET cash_balance = cash_balance + ? WHERE user_id = ?', { price, creatorId })
    elseif currency == 'prismas' then
        MySQL.query.await('UPDATE privy_wallet SET prisma_balance = prisma_balance + ? WHERE user_id = ?', { price, creatorId })
    end

    TriggerClientEvent("privy:client:subscribeResponse", src, { success = true })
end)
