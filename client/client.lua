while GetResourceState("lb-phone") ~= "started" do
    Wait(500)
end

Wait(1000)

local url = GetResourceMetadata(GetCurrentResourceName(), "ui_page", 0)

local function AddApp()
    local added, errorMessage = exports["lb-phone"]:AddCustomApp({
        identifier = Config.Identifier,

        name = Config.Name,
        description = Config.Description,
        developer = Config.Developer,

        defaultApp = Config.DefaultApp,
        size = 59812,

        ui = url:find("http") and url or GetCurrentResourceName() .. "/" .. url,
        icon = url:find("http") and url .. "/public/icon.svg" or "https://cfx-nui-" .. GetCurrentResourceName() .. "/ui/dist/icon.svg",

        fixBlur = true,

        onClose = function()
            -- cleanup if needed
        end
    })

    if not added then
        print("Could not add Privy app:", errorMessage)
    end
end

AddApp()

AddEventHandler("onResourceStart", function(resource)
    if resource == "lb-phone" then
        AddApp()
    end
end)

-- Helper to get citizenid from qbx_core
local function GetCitizenId()
    local player = exports.qbx_core:GetPlayerData()
    if player and player.citizenid then
        return player.citizenid
    end
    return nil
end

-- =====================
-- AUTH CALLBACKS
-- =====================

RegisterNUICallback("login", function(data, cb)
    local citizenid = GetCitizenId()
    if not citizenid then
        cb({ success = false, message = "Player data not available" })
        return
    end

    local p = promise.new()
    TriggerServerEvent("privy:server:login", citizenid)

    RegisterNetEvent("privy:client:loginResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("register", function(data, cb)
    local citizenid = GetCitizenId()
    if not citizenid then
        cb({ success = false, message = "Player data not available" })
        return
    end

    local p = promise.new()
    TriggerServerEvent("privy:server:register", citizenid, data.username, data.displayName)

    RegisterNetEvent("privy:client:registerResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- POSTS CALLBACKS
-- =====================

RegisterNUICallback("getPosts", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getPosts")

    RegisterNetEvent("privy:client:postsResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("getPost", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getPost", data.postId)

    RegisterNetEvent("privy:client:getPostResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("createPost", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:createPost", data.content, data.image, data.images, data.visibility)

    RegisterNetEvent("privy:client:createPostResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("likePost", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:likePost", data.postId)

    RegisterNetEvent("privy:client:likePostResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("tipPost", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:tipPost", data.postId, data.amount)

    RegisterNetEvent("privy:client:tipPostResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- COMMENTS CALLBACKS
-- =====================

RegisterNUICallback("getComments", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getComments", data.postId)

    RegisterNetEvent("privy:client:commentsResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("addComment", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:addComment", data.postId, data.content)

    RegisterNetEvent("privy:client:addCommentResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("getLikedPosts", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getLikedPosts")

    RegisterNetEvent("privy:client:likedPostsResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- PROFILE CALLBACKS
-- =====================

RegisterNUICallback("getProfile", function(data, cb)
    local p = promise.new()
    local targetId = data and data.userId or nil
    TriggerServerEvent("privy:server:getProfile", targetId)

    RegisterNetEvent("privy:client:profileResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("updateProfile", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:updateProfile", data)

    RegisterNetEvent("privy:client:updateProfileResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- MESSAGES CALLBACKS
-- =====================

RegisterNUICallback("getMessages", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getMessages")

    RegisterNetEvent("privy:client:messagesResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("getChatMessages", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getChatMessages", data.userId)

    RegisterNetEvent("privy:client:chatMessagesResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("sendMessage", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:sendMessage", data.receiverId or data.userId, data.content, data.type)

    RegisterNetEvent("privy:client:sendMessageResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("sendMediaMessage", function(data, cb)
    -- Open LB Phone gallery/camera for media capture
    local mediaUrl = nil

    if data.type == 'image' then
        components.setGallery({
            includeImages = true,
            includeVideos = false,
            onSelect = function(selected)
                local photo = type(selected) == 'table' and selected[1] or selected
                if photo and photo.src then
                    mediaUrl = photo.src
                end
            end,
            onCancel = function()
                cb({ success = false })
            end
        })
    elseif data.type == 'video' then
        components.setGallery({
            includeImages = false,
            includeVideos = true,
            onSelect = function(selected)
                local video = type(selected) == 'table' and selected[1] or selected
                if video and video.src then
                    mediaUrl = video.src
                end
            end,
            onCancel = function()
                cb({ success = false })
            end
        })
    end

    -- Wait for media selection
    while mediaUrl == nil do
        Wait(100)
    end

    if mediaUrl then
        local p = promise.new()
        TriggerServerEvent("privy:server:sendMediaMessage", data.userId, data.type, mediaUrl)

        RegisterNetEvent("privy:client:sendMediaMessageResponse", function(response)
            p:resolve(response)
        end)

        local result = Citizen.Await(p)
        cb(result)
    end
end)

RegisterNUICallback("sendPayment", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:sendPayment", data.userId, data.amount, data.note)

    RegisterNetEvent("privy:client:sendPaymentResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- DISCOVERY CALLBACKS
-- =====================

RegisterNUICallback("discover", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:discover")

    RegisterNetEvent("privy:client:discoverResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("searchUsers", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:searchUsers", data.query)

    RegisterNetEvent("privy:client:searchUsersResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("followUser", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:followUser", data.userId)

    RegisterNetEvent("privy:client:followUserResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- STORIES CALLBACKS
-- =====================

RegisterNUICallback("getStories", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getStories")

    RegisterNetEvent("privy:client:storiesResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("getMyStories", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getMyStories")

    RegisterNetEvent("privy:client:myStoriesResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("getMyPosts", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getMyPosts")

    RegisterNetEvent("privy:client:myPostsResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("deleteStory", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:deleteStory", data.storyId)

    RegisterNetEvent("privy:client:deleteStoryResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("deletePost", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:deletePost", data.postId)

    RegisterNetEvent("privy:client:deletePostResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("createStory", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:createStory", data.mediaUrl, data.caption, data.type)

    RegisterNetEvent("privy:client:createStoryResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("pickPhoto", function(data, cb)
    components.setGallery({
        includeImages = true,
        includeVideos = false,
        onSelect = function(selected)
            local photo = type(selected) == 'table' and (selected.src and selected or selected[1]) or selected
            if photo and photo.src then
                cb({ success = true, url = photo.src })
            else
                cb({ success = false })
            end
        end,
        onCancel = function()
            cb({ success = false })
        end
    })
end)

RegisterNUICallback("capturePhoto", function(data, cb)
    -- Use LB Phone camera to capture a photo
    components.setCamera({
        onSelect = function(photo)
            if photo and photo.src then
                cb({ success = true, url = photo.src })
            else
                cb({ success = false })
            end
        end,
        onCancel = function()
            cb({ success = false })
        end
    })
end)

RegisterNUICallback("startRecording", function(data, cb)
    -- Use LB Phone camera to start video recording
    components.setCamera({
        mode = 'video',
        onSelect = function(video)
            if video and video.src then
                cb({ success = true, url = video.src })
            else
                cb({ success = false })
            end
        end,
        onCancel = function()
            cb({ success = false })
        end
    })
end)

RegisterNUICallback("stopRecording", function(data, cb)
    -- Video recording stop is handled by the camera component
    -- The result comes back through the startRecording callback
    cb({ success = true })
end)

-- =====================
-- BLOCK / UNBLOCK CALLBACKS
-- =====================

RegisterNUICallback("blockUser", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:blockUser", data.userId)

    RegisterNetEvent("privy:client:blockUserResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("unblockUser", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:unblockUser", data.userId)

    RegisterNetEvent("privy:client:unblockUserResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("getBlockedUsers", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getBlockedUsers")

    RegisterNetEvent("privy:client:blockedUsersResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- REPORT CALLBACKS
-- =====================

RegisterNUICallback("reportPost", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:reportPost", data.postId, data.userId, data.reason)

    RegisterNetEvent("privy:client:reportPostResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- SUBSCRIPTION CALLBACKS
-- =====================

-- =====================
-- REAL-TIME MESSAGE LISTENER
-- =====================

RegisterNetEvent("privy:client:newMessage", function(data)
    SendNuiMessage(json.encode({
        type = 'privy:newMessage',
        data = data
    }))
end)

-- =====================
-- WALLET CALLBACKS
-- =====================

RegisterNUICallback("getWallet", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getWallet")

    RegisterNetEvent("privy:client:walletResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("withdrawWallet", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:withdrawWallet", data.currency, data.amount)

    RegisterNetEvent("privy:client:withdrawWalletResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

-- =====================
-- NOTIFICATIONS CALLBACKS
-- =====================

RegisterNUICallback("getNotifications", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:getNotifications")

    RegisterNetEvent("privy:client:notificationsResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("markNotificationsRead", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:markNotificationsRead")

    RegisterNetEvent("privy:client:markNotificationsReadResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)

RegisterNUICallback("subscribe", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:subscribe", data.creatorId)

    RegisterNetEvent("privy:client:subscribeResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)
