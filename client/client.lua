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

RegisterNUICallback("createPost", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:createPost", data.content, data.image)

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

RegisterNUICallback("sendMessage", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:sendMessage", data.receiverId, data.content)

    RegisterNetEvent("privy:client:sendMessageResponse", function(response)
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

RegisterNUICallback("followUser", function(data, cb)
    local p = promise.new()
    TriggerServerEvent("privy:server:followUser", data.userId)

    RegisterNetEvent("privy:client:followUserResponse", function(response)
        p:resolve(response)
    end)

    local result = Citizen.Await(p)
    cb(result)
end)
