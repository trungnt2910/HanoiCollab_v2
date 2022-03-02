// ==UserScript==
// @name         HanoiCollab_v2
// @namespace    https://trungnt2910.github.io/
// @version      0.0.1
// @description  HanoiColab client for Second Generation HanoiCollab server
// @author       trungnt2910
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=edu.vn
// @downloadURL  https://raw.githubusercontent.com/trungnt2910/HanoiCollab_v2/master/Clients/HanoiCollab_v2.user.js
// @updateURL    https://raw.githubusercontent.com/trungnt2910/HanoiCollab_v2/master/Clients/HanoiCollab_v2.meta.js
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.2/signalr.min.js
// @match        https://forms.office.com/Pages/ResponsePage.aspx?*
// @match        https://shub.edu.vn/*
// @match        https://azota.vn/*
// ==/UserScript==

let HanoiCollabGlobals = {};

var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function EscapeHtml(string) 
{
    return String(string).replace(/[&<>"'`=\/]/g, function (s) 
    {
        return entityMap[s];
    });
}

async function ServerPrompt()
{
    var server = prompt("Enter your HanoiCollab server address", (HanoiCollabGlobals.Server) ? HanoiCollabGlobals.Server : "http://localhost:6969/");
    if (!server.endsWith("/"))
    {
        server += "/";
    }
    await GM_setValue("HanoiCollabServer", server);
    HanoiCollabGlobals.Server = server;
    return server;
}

async function LoginPopup(displayText)
{
    await new Promise(async function(resolve, reject)
    {
        var oldUsername = await GM_getValue("HanoiCollabUsername", "");

        if (elem = document.getElementById("hanoicollab-login-popup-container"))
        {
            elem.remove();
        }

        displayText = displayText ? displayText : "Please sign in to use HanoiCollab";

        //--- Use jQuery to add the form in a "popup" dialog.
        $("body").append (`
        <div id="hanoicollab-login-popup-container">
            <p id="hanoicollab-login-popup-background"></p>      
            <div id="hanoicollab-login-popup">
                <p>${displayText}</p>
                <input type="text" id="username" value="${oldUsername}">                           
                <input type="password" id="password" value="">

                <p id="status">Please enter your HanoiCollab username and password.</p>
                <button id="hanoicollab-login-button">Login</button>
                <button id="hanoicollab-close-button">Later</button>
                <button id="hanoicollab-close-suppress-button">Don't bother me today</button>
            </div>
        </div>                                                                    
        `);

        $("#hanoicollab-login-button").click(function() {
            var username = $("#username").val();
            var password = $("#password").val();

            $("#status").text("Logging in...");
            $("#username").prop("disabled", true);
            $("#password").prop("disabled", true);

            GM_xmlhttpRequest({
                method: "POST",
                url: HanoiCollabGlobals.Server + "api/Accounts/login",
                data: JSON.stringify({
                    Name: username,
                    Password: password
                }),
                headers: {
                    "Content-Type": "application/json"
                },
                onload: function(response) {
                    if (response.status === 200)
                    {
                        var data = JSON.parse(response.responseText);
                        if (data.token)
                        {
                            GM_setValue("HanoiCollabUsername", username);
                            GM_setValue("HanoiCollabIdentity", JSON.stringify(data));
                            $("#hanoicollab-login-popup-container").hide();
                            HanoiCollabGlobals.Identity = data;
                            resolve(data);
                        }
                        else
                        {
                            $("#status").text("Login failed");
                        }    
                    }
                    else
                    {
                        $("#status").text("Login failed: " + response.statusText);
                    }
                },
                onerror: function(response) {
                    $("#status").text("Login failed: " + response.statusText);
                }    
            });
        });

        
        $("#hanoicollab-close-button").click(function() {
            $("#hanoicollab-login-popup-container").hide();
            reject("User cancelled");
        });

        $("#hanoicollab-close-suppress-button").click(function() {
            $("#hanoicollab-login-popup-container").hide();
            reject("User cancelled");
        });

        //--- CSS styles make it work...
        GM_addStyle (`                                                 
        #hanoicollab-login-popup {                                         
            position:               fixed;                          
            top:                    30%;                            
            left:                   40%;                            
            padding:                2em;                            
            background:             powderblue;                     
            border:                 3px double black;               
            border-radius:          1ex;                            
            z-index:                9999;                            
        }                                                           
        #hanoicollab-login-popup-container button{                  
            cursor:                 pointer;                        
            margin:                 1em 1em 0;                      
            border:                 1px outset buttonface;          
        }
        #hanoicollab-login-popup-background {       
            position:               fixed;       
            top:                    0;
            left:                   0;
            right:                  0;
            bottom:                 0;
            background-color:       rgba(0,0,0,0.5);
            z-index:                9998;
          }
        `);
    })

}

async function SetupServer()
{
    var storedServer = await GM_getValue("HanoiCollabServer", null);
    if (!storedServer)
    {
        storedServer = ServerPrompt();
    }
    HanoiCollabGlobals.Server = storedServer;
    return storedServer;
}

async function SetupIdentity()
{
    var storedIdentity = await GM_getValue("HanoiCollabIdentity", null);
    if (!storedIdentity)
    {
        return await LoginPopup();
    }
    HanoiCollabGlobals.Identity = JSON.parse(storedIdentity);
    return HanoiCollabGlobals.Identity;
}

function SetupKeyBindings()
{
    document.addEventListener('keyup', function (e)
    {
        if (e.altKey && e.key === 's')
        {
            ServerPrompt();
        }
        if (e.altKey && e.key === 'l')
        {
            LoginPopup(HanoiCollabGlobals.Server);
        }
    }, false);
}

async function GetToken()
{
    var identity = HanoiCollabGlobals.Identity;
    if (Date.parse(identity.expiration) <= Date.now())
    {
        await LoginPopup("Session expired. Please sign in to continue using HanoiCollab.");
    }
    return HanoiCollabGlobals.Identity.token;
}

async function SetupChatConnection()
{
    var connection = new signalR
        .HubConnectionBuilder()
        .withUrl(HanoiCollabGlobals.Server + "hubs/chat", { accessTokenFactory: GetToken })
        .build();
    
    await connection.start();

    HanoiCollabGlobals.ChatConnection = connection;
    return connection;
}

async function SetupChatUserInterface()
{
    $("body").append (`
    <div id="hanoicollab-chat-container" style="position:fixed;right:0;bottom:0;height:20%;width:30%;background-color:rgba(0,127,255,0.5);">
        <div id="hanoicollab-chat-messages" style="overflow:auto;"></div>
        <input type="text" id="hanoicollab-chat-input" style="width:100%;bottom:0;position:fixed">
    </div>
    `);

    $("#hanoicollab-chat-input").keyup(function(e) 
    {
        if (e.key === "Enter") 
        {
            var message = $("#hanoicollab-chat-input").val();
            $("#hanoicollab-chat-input").val("");
            HanoiCollabGlobals.ChatConnection.invoke("SendMessage", location.href, message);
            e.preventDefault();
        }
    });

    HanoiCollabGlobals.ChatConnection.on("ReceiveMessage", function(name, message)
    {
        $("#hanoicollab-chat-messages").append(`<p><b>${EscapeHtml(name)}<b/>: ${EscapeHtml(message)}</p>`);
    })

    await HanoiCollabGlobals.ChatConnection.invoke("JoinChannel", location.href);

    document.addEventListener('keyup', function (e)
    {
        if (e.altKey && e.key === 'c')
        {
            $("#hanoicollab-chat-container").toggle();
        }
    }, false);
}

async function WaitForDocumentReady()
{
    await new Promise(function(resolve, reject)
    {
        $("document").ready(function()
        {
            resolve();
        });
    });
}

(async function() 
{
    await WaitForDocumentReady();
    SetupKeyBindings();
    await SetupServer();
    await SetupIdentity();
    await SetupChatConnection();
    await SetupChatUserInterface();
})();