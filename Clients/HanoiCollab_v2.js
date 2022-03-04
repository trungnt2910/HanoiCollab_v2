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
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.2/signalr.min.js
// @match        https://forms.office.com/Pages/ResponsePage.aspx?*
// @match        https://shub.edu.vn/*
// @match        https://azota.vn/*
// ==/UserScript==

let HanoiCollabGlobals = {};

function HanoiCollab$(obj)
{
    if (typeof obj === "string")
    {
        return $(HanoiCollabGlobals.Document).contents().find(obj);
    }
    return $(obj);
}

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
    var server = prompt("Enter your HanoiCollab server address", (HanoiCollabGlobals.Server) ? HanoiCollabGlobals.Server : "https://hanoicollab.herokuapp.com/");
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
    if (elem = HanoiCollabGlobals.Document.getElementById("hanoicollab-login-popup-container"))
    {
        return await HanoiCollabGlobals.LoginPopupPromise;
    }

    HanoiCollabGlobals.LoginPopupPromise = new Promise(async function(resolve, reject)
    {
        var oldUsername = await GM_getValue("HanoiCollabUsername", "");

        displayText = displayText ? displayText : "Please sign in to use HanoiCollab";

        //--- Use jQuery to add the form in a "popup" dialog.
        HanoiCollab$(HanoiCollabGlobals.Document.body).append (`
        <div id="hanoicollab-login-popup-container" class="hanoicollab-basic-container">
            <p id="hanoicollab-login-popup-background" style="position:fixed;top:0;left:0;right:0;bottom:0;background-color:rgba(0,0,0,0.9);z-index:9998;"></p>      
            <div id="hanoicollab-login-popup" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:50%;padding:2em;color:white;background-color:rgba(0,127,255,0.75);border-radius:1ex;z-index:9999;">
                <p class="hanoicollab-basic-container">${displayText}</p>
                <p class="hanoicollab-basic-container">Your current HanoiCollab server: <a class="hanoicollab-basic-container" href="${HanoiCollabGlobals.Server}" style="color:orange;">${HanoiCollabGlobals.Server}</a>.</p>
                <p class="hanoicollab-basic-container">Press Alt+S to change your server.</p>
                <input class="hanoicollab-basic-container" type="text" id="hanoicollab-username" value="${oldUsername}">                           
                <input class="hanoicollab-basic-container" type="password" id="hanoicollab-password" value="">

                <style>
                    .hanoicollab-button {
                        background-color:       rgba(0,127,127,0.9);
                        border:                 1px solid black;
                        border-radius:          1ex;
                        padding:                0.5em;
                        color:                  white;
                        cursor:                 pointer;
                        line-height:            1.5;
                        text-transform:         unset !important;
                    }
                </style>

                <p class="hanoicollab-basic-container" id="hanoicollab-login-status">Please enter your HanoiCollab username and password.</p>
                <button class="hanoicollab-button" id="hanoicollab-login-button">Login</button>
                <button class="hanoicollab-button" id="hanoicollab-register-button">Register</button>
                <button class="hanoicollab-button" id="hanoicollab-close-button">Later</button>
                <button class="hanoicollab-button" id="hanoicollab-close-suppress-button">Don't bother me today</button>
            </div>
        </div>                                                                    
        `);

        function EnableFields()
        {
            HanoiCollab$("#hanoicollab-username").prop("disabled", false);
            HanoiCollab$("#hanoicollab-password").prop("disabled", false);
        }

        function DisableFields()
        {
            HanoiCollab$("#hanoicollab-username").prop("disabled", true);
            HanoiCollab$("#hanoicollab-password").prop("disabled", true);
        }

        HanoiCollab$("#hanoicollab-login-button").click(function()
        {
            var username = HanoiCollab$("#hanoicollab-username").val();
            var password = HanoiCollab$("#hanoicollab-password").val();

            HanoiCollab$("#hanoicollab-login-status").text("Logging in...");
            DisableFields();

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
                onload: function(response) 
                {
                    if (response.status === 200)
                    {
                        var data = JSON.parse(response.responseText);
                        if (data.token)
                        {
                            GM_setValue("HanoiCollabUsername", username);
                            GM_setValue("HanoiCollabIdentity", JSON.stringify(data));
                            HanoiCollab$("#hanoicollab-login-popup-container").remove();
                            HanoiCollabGlobals.Identity = data;
                            if (HanoiCollabGlobals.OnIdentityChange)
                            {
                                HanoiCollabGlobals.OnIdentityChange();
                            }
                            resolve(data);
                        }
                        else
                        {
                            HanoiCollab$("#hanoicollab-login-status").text("Error: Invalid response from server.");
                            EnableFields();
                        }    
                    }
                    else
                    {
                        HanoiCollab$("#hanoicollab-login-status").text("Error: " + response.statusText);
                        EnableFields();
                    }
                },
                onerror: function(response) 
                {
                    HanoiCollab$("#hanoicollab-login-status").text("Error: " + response.statusText);
                    EnableFields();
                }    
            });
        });

        HanoiCollab$("#hanoicollab-register-button").click(function()
        {
            var username = HanoiCollab$("#hanoicollab-username").val();
            var password = HanoiCollab$("#hanoicollab-password").val();

            HanoiCollab$("#hanoicollab-login-status").text("Registering...");
            DisableFields();

            GM_xmlhttpRequest({
                method: "POST",
                url: HanoiCollabGlobals.Server + "api/Accounts/register",
                data: JSON.stringify({
                    Name: username,
                    Password: password
                }),
                headers: {
                    "Content-Type": "application/json"
                },
                onload: function(response) {
                    var data = JSON.parse(response.responseText);
                    HanoiCollab$("#hanoicollab-login-status").text(`${data.Status}: ${data.Message}`);
                    EnableFields();
                },
                onerror: function(response) {
                    HanoiCollab$("#hanoicollab-login-status").text("Error: " + response.statusText);
                }
            });
        });

        
        HanoiCollab$("#hanoicollab-close-button").click(function()
        {
            HanoiCollab$("#hanoicollab-login-popup-container").remove();
            reject("User cancelled");
        });

        HanoiCollab$("#hanoicollab-close-suppress-button").click(function()
        {
            HanoiCollab$("#hanoicollab-login-popup-container").remove();
            reject("User cancelled");
        });
    });

    return await HanoiCollabGlobals.LoginPopupPromise;
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
    HanoiCollabGlobals.Document.addEventListener('keyup', function (e)
    {
        if (e.altKey && e.key === 's')
        {
            ServerPrompt();
        }
        if (e.altKey && e.key === 'l')
        {
            LoginPopup();
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

    connection.DeliberateClose = false;

    connection.onclose(function()
    {
        if (connection.DeliberateClose)
        {
            return;
        }
        console.log("Reconnecting to chat channel...");
        var handle = setInterval(async function()
        {
            await connection.start();
            await HanoiCollabGlobals.ChatConnection.invoke("JoinChannel", HanoiCollabGlobals.Channel);
            clearInterval(handle);
        }, 5000);
    });

    HanoiCollabGlobals.ChatConnection = connection;
    return connection;
}

async function SetupChatUserInterface()
{
    HanoiCollab$("#hanoicollab-chat-container").remove();

    HanoiCollab$("body").append (`
    <div id="hanoicollab-chat-container" class="hanoicollab-basic-container" style="position:fixed;right:0;bottom:0;height:20%;width:30%;border-radius:1ex;background-color:rgba(0,127,255,0.9);z-index:9997;user-select:text">
        <div id="hanoicollab-chat-messages" style="width:100%;height:90%;overflow:auto;"></div>
        <input type="text" autocomplete="off" id="hanoicollab-chat-input" style="width:100%;bottom:0;position:fixed">
    </div>
    `);

    HanoiCollab$("#hanoicollab-chat-input").keyup(async function(e) 
    {
        if (e.key === "Enter") 
        {
            var message = HanoiCollab$("#hanoicollab-chat-input").val();
            // Prevent empty message spam.
            if (message)
            {
                HanoiCollab$("#hanoicollab-chat-input").val("");
                await HanoiCollabGlobals.ChatConnection.invoke("SendMessage", HanoiCollabGlobals.Channel, message);
                e.preventDefault();    
            }
        }
    });

    HanoiCollabGlobals.ChatConnection.on("ReceiveMessage", function(name, message)
    {
        HanoiCollab$("#hanoicollab-chat-messages").append(`<p class="hanoicollab-basic-container" style="user-select:text;"><b>${EscapeHtml(name)}</b>: ${EscapeHtml(message)}</p>`);
        HanoiCollab$("#hanoicollab-chat-messages").animate({scrollTop: $("#hanoicollab-chat-messages").prop("scrollHeight")}, 1000);
    })

    await HanoiCollabGlobals.ChatConnection.invoke("JoinChannel", HanoiCollabGlobals.Channel);

    HanoiCollabGlobals.Document.addEventListener('keyup', function (e)
    {
        if (e.altKey && e.key === 'c')
        {
            HanoiCollab$("#hanoicollab-chat-container").toggle();
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

async function TerminateChatConnection()
{
    if (HanoiCollabGlobals.ChatConnection)
    {
        await HanoiCollabGlobals.ChatConnection.invoke("LeaveChannel", HanoiCollabGlobals.Channel);
        HanoiCollabGlobals.ChatConnection.DeliberateClose = true;
        await HanoiCollabGlobals.ChatConnection.stop();
        HanoiCollabGlobals.ChatConnection = null;
    }
}

async function Download(url)
{
    return await new Promise(function (resolve, reject)
    {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function(r)
            {
                resolve(r);
            },
            onerror: function(r)
            {
                resolve(r);
            }
        });
    });
}

HanoiCollabScriptPatches = {
    "shub.edu.vn": function(src, code)
    {
        return code;
    },
    "azota.vn": function(src, code)
    {
        if (src.includes("main") || src.includes("runtime"))
        {
            code = code.replace(/document\.head\.appendChild/g, `(function(child)
            {
                if (child.tagName !== "SCRIPT")
                {
                    document.head.appendChild(child);
                    return;
                }
                if (child.src && child.src.includes("es2015"))
                {
                    var request = new XMLHttpRequest();
                    request.open("GET", child.src, false);
                    request.send(null);
                    var scriptContent = request.responseText;
                    scriptContent = scriptContent.replace(/constructor\\([a-zA-Z,]*?\\){/gm, (match) => {return match + "try{if(!window.HanoiCollabExposedVariables)window.HanoiCollabExposedVariables=[];HanoiCollabExposedVariables.push(this);}catch(e){console.log(e);}"});
                    var scriptBlob = new Blob([scriptContent], {type: "application/javascript"});
                    var scriptURL = URL.createObjectURL(scriptBlob);
                    child.removeAttribute("integrity");
                    child.src = scriptURL;
                }
                document.head.appendChild(child);
            })`
            );
            code = code.replace(/sendMonitorAction\([A-Za-z,]*?\){/, match => match + `console.log("Blocked monitor action.");return;`);
            code = code.replace(/trackInfos:[^,}]*/, `trackInfos: null`);
            code = code.replace(/resultTrack:[^,}]*/, `resultTrack: null`);
        }
        return code;
    },
    "forms.office.com": function(src, code)
    {
        return code;
    }
};

async function SetupSandbox()
{
    var style = window.document.createElement("style");
    style.innerText = `body {
       margin: 0;
       overflow: hidden;
    }
    #iframe1 {
        position:absolute;
        left: 0px;
        width: 100%;
        top: 0px;
        height: 100%;
    }`;
    window.document.body.textContent = "";
    window.document.body.appendChild(style);
    var frame = window.document.createElement("iframe");
    frame.id = "iframe1";
    window.document.body.appendChild(frame);
    var request = await Download(location.href);
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(request.responseText, 'text/html');

    for (var base of htmlDoc.getElementsByTagName("base"))
    {
        base.href = location.origin + "/";
    }

    async function PatchScript(script)
    {
        if (!script || script.tagName !== "SCRIPT")
        {
            return;
        }

        function PatchWindowAccess(code)
        {
            return code
                .replace(/window\.location/g, "window.parent.location")
                .replace(/window\.history/g, "window.parent.history")
                .replace(/document\.location\.href/g, "window.parent.document.location.href")
                .replace(/window\.parent\.location\.href=([^=])/g, function(match)
                {
                    var index = match.indexOf("=");
                    return match.slice(0, index + 1) + "window.parent.document.location.origin+" + match.slice(index + 1);
                });
        }
        if (script.src)
        {
            var scriptSource = script.src;
            var request = await Download(scriptSource);
            var scriptContent = HanoiCollabScriptPatches[HanoiCollabGlobals.Provider](scriptSource, PatchWindowAccess(request.responseText));
            var scriptBlob = new Blob([scriptContent], {type: "application/javascript"});
            script.src = URL.createObjectURL(scriptBlob);
        }
    
        if (script.textContent)
        {
            script.textContent = PatchWindowAccess(script.textContent);
        }

        script.removeAttribute("integrity");
    }

    function PatchLocation(elem)
    {
        if (!elem.getAttribute)
        {
            return;
        }
        var src = elem.getAttribute("src");
        var href = elem.getAttribute("href");
        if (href)
        {
            if (!href.startsWith("http"))
            {
                elem.setAttribute("href", top.location.origin + href);
            }  
        }
        if (src)
        {
            if (src.startsWith("blob") || src.startsWith("data"))
            {
                return;
            }
            if (!src.startsWith("http"))
            {
                elem.setAttribute("src", top.location.origin + src);
            }  
        }
    }

    for (var elem of htmlDoc.documentElement.getElementsByTagName("*"))
    {
        PatchLocation(elem);
        await PatchScript(elem);
    }

    var blob = new Blob([htmlDoc.documentElement.outerHTML], {type: "text/html"});

    return await new Promise(function (resolve, reject)
    {
        frame.onload = function()
        {
            new MutationObserver(async function(mutations)
            {
                for (var mutation of mutations)
                {
                    for (var node of mutation.addedNodes)
                    {
                        PatchLocation(node);
                        await PatchScript(node);
                        if (node.getElementsByTagName)
                        {
                            for (var elem of node.getElementsByTagName("*"))
                            {
                                PatchLocation(elem);
                                await PatchScript(elem);
                            }    
                        }
                    }
                }
            }).observe(frame.contentDocument.documentElement, {childList: true, subtree: true});
            HanoiCollabGlobals.Document = frame.contentDocument;
            HanoiCollabGlobals.Window = frame.contentWindow;
            resolve({document: frame.contentDocument, window: frame.contentWindow});
        }
        frame.src = URL.createObjectURL(blob);
    });
}

function SetupStyles()
{
    var style = HanoiCollabGlobals.Document.createElement("style");
    style.innerText = 
    `
    *[id^="hanoicollab-"] {
        box-sizing:                  border-box;
        font-family:                 Segoe UI,Segoe WP,Tahoma,Arial,sans-serif;
        font-size:                   14px;
        font-stretch:                100%;
        font-style:                  normal;
        font-variant-caps:           normal;
        font-variant-east-asian:     normal;
        font-variant-ligatures:      normal;
        font-variant-numeric:        normal;
        font-weight:                 400;
        letter-spacing:              normal;
        line-height:                 1.5;
        margin:                      0;
        margin-block-start:          1em;
        margin-block-end:            1em;
        margin-inline-start:         0px;
        margin-inline-end:           0px;
        padding:                     0;
        text-size-adjust:            100%;
        user-select:                 none;
        -webkit-font-smoothing:      antialiased;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    }
    .hanoicollab-basic-container p {
        margin:                     0;
    }
    `;
    HanoiCollabGlobals.Document.body.appendChild(style);
}

async function WaitForTestReady()
{
    return await new Promise((resolve, reject) => 
    {    
        switch (HanoiCollabGlobals.Provider)
        {
            case "azota.vn":
            {
                // Top, not hanoicollab. HanoiCollab's window is a blob, remember?
                if (!top.window.location.href.includes("take-test"))
                {
                    resolve(false);
                    return;
                }
                var hadFormState = false;
                var interval = setInterval(function()
                {
                    if (!hadFormState)
                    {
                        if (HanoiCollabGlobals.Window.HanoiCollabExposedVariables)
                        {
                            for (var v of HanoiCollabGlobals.Window.HanoiCollabExposedVariables)
                            {
                                if (v.saveToStorage && v.questionList)
                                {
                                    // Clean the other junk.
                                    HanoiCollabGlobals.Window.HanoiCollabExposedVariables = [];
                                    // Name from our Office Forms experience.
                                    HanoiCollabGlobals.Window.HanoiCollabExposedVariables.FormState = v;
                                    // Prevent new junk.
                                    HanoiCollabGlobals.Window.HanoiCollabExposedVariables.push = function(){};
                                    hadFormState = true;
                                    break;
                                }
                            }
                        }
                    }
                    else if (HanoiCollab$(".question-content").length)
                    {
                        clearInterval(interval);
                        resolve(true);
                        return;
                    }
                }, 1000);
            }
            break;
            default:
                resolve(false);
        }
    })
}

function GetFormId()
{
    switch (HanoiCollabGlobals.Provider)
    {
        case "azota.vn":
            return "" + HanoiCollabGlobals.Window.HanoiCollabExposedVariables.FormState.exam_obj.id;
        default:
            return "";
    }
}

// A unified interface for getting questions.
function GetQuestions()
{
    switch (HanoiCollabGlobals.Provider)
    {
        case "azota.vn":
        {
            var result = [];

            var elements = HanoiCollab$(".question-content");
            var questions = HanoiCollabGlobals.Window.HanoiCollabExposedVariables.FormState.questionList;
            var parser = new DOMParser();

            for (var i = 0; i < questions.length; ++i)
            {
                var info = 
                {
                    HtmlElement: elements[i],
                    Id: "" + questions[i].id,
                    Type: questions[i].answerType === 1 ? "multipleChoice" : "written", // The last type is hybrid, for SHUB questions.
                    Index: i,
                    // No hybrid types.
                    IsMultipleChoice: function() 
                    {
                        return this.Type == "multipleChoice";
                    },
                    IsWritten: function()
                    {
                        return this.Type == "written"; 
                    }
                };

                info.GetUserAnswer = function()
                {
                    var info = this;
                    var ans = HanoiCollabGlobals.Window.HanoiCollabExposedVariables.FormState.answerList.find(function (a)
                    {
                        return a.questionId == info.Id;
                    });
                    if (!ans)
                    {
                        return null;
                    }
                    return ans.answerContent[0].content;
                }

                info.SetUserAnswer = function(answer)
                {
                    if (this.SendUserAnswer)
                    {
                        this.SendUserAnswer(answer);
                    }
                    var sheetContentButton = HanoiCollab$(".sheet_content").find(".no-answered")[this.Index];
                    if (answer)
                    {                     
                        sheetContentButton.style.backgroundColor = "rgba(60, 141, 188, 1)";
                        sheetContentButton.style.color = "rgb(255, 255, 255)";
                    }
                    else
                    {
                        sheetContentButton.style.background = "#fff";
                        sheetContentButton.style.color =  "#111";
                    }
                }

                if (questions[i].answerType === 1)
                {
                    info.Answers = [];
                    for (var j = 0; j < questions[i].answerConfig.length; ++j)
                    {
                        info.Answers.push({Id: questions[i].answerConfig[j].key, Alpha: questions[i].answerConfig[j].alpha});
                    }

                    info.ClearUserAnswer = function()
                    {
                        var info = this;
                        var formState = HanoiCollabGlobals.Window.HanoiCollabExposedVariables.FormState;
                        formState.answerList = formState.answerList.filter(function (a)
                        {
                            return a.questionId != info.Id;
                        });
                        formState.saveToStorage(formState.answerList, formState.noteList, formState.files);
                        HanoiCollab$(this.HtmlElement).find(".no-answered").each(function (i, button)
                        {
                            button.style.background = "#fff";
                            button.style.color =  "#111";
                        });
                        for (var j = 0; j < questions[info.Index].answerConfig.length; ++j)
                        {
                            questions[info.Index].answerConfig[j].checked = false;
                        }
                    }
                }
                else
                {
                    info.ClearUserAnswer = function()
                    {
                        var info = this;
                        var formState = HanoiCollabGlobals.Window.HanoiCollabExposedVariables.FormState;
                        formState.answerList = formState.answerList.filter(function (a)
                        {
                            return a.questionId != info.Id;
                        });
                        formState.saveToStorage(formState.answerList, formState.noteList, formState.files);
                        HanoiCollab$(this.HtmlElement).find("textarea").each(function (i, textArea)
                        {
                            textArea.value = null;
                        });
                    }
                }

                info.CommunityAnswersHtml = parser.parseFromString(
                    `
                    <div class="hanoicollab-community-answers">
                        <div class="hanoicollab-community-answers-header">Community answers:</div>
                        <div class="hanoicollab-community-answers-multiple-choice">
                            <div class="hanoicollab-community-answers-multiple-choice-header">Multiple choice:</div>
                            <div class="hanoicollab-community-answers-multiple-choice-contents"></div>
                        </div>
                        <div class="hanoicollab-community-answers-written">
                            <div class="hanoicollab-community-answers-written-header">Written:</div>
                            <select class="hanoicollab-community-answers-written-select">
                            </select>
                            <div class="hanoicollab-community-answers-written-content" style="user-select:text;"></div>
                        </div>
                    </div>
                    `
                , "text/html").body.firstChild;
        
                if (info.Type == "multipleChoice")
                {
                    info.CommunityAnswersHtml.querySelector(".hanoicollab-community-answers-written").style.display = "none";
                }
        
                if (info.Type == "written")
                {
                    info.CommunityAnswersHtml.querySelector(".hanoicollab-community-answers-multiple-choice").style.display = "none";
                }
     
                info.UpdateWrittenSelect = function(select)
                {
                    var value = select.value;
                    var contentElement = select.parentElement.querySelector(".hanoicollab-community-answers-written-content");
                    contentElement.innerText = info.CommunityAnswers.find(function(ans){return ans.User == value}).Answer;
                }

                info.CommunityAnswersHtml.querySelector("select").addEventListener("change", function()
                {
                    info.UpdateWrittenSelect(this);
                });

                info.SendUserAnswer = async function(answer)
                {
                    if (HanoiCollabGlobals.ExamConnection)
                    {
                        var info = this;
                        await HanoiCollabGlobals.ExamConnection.invoke("UpdateAnswer", GetFormId(), info.Id, answer);    
                    }
                }

                info.UpdateCommunityAnswersHtml = function()
                {
                    var info = this;
                    if (info.IsMultipleChoice())
                    {
                        var communityAnswers = info.CommunityAnswers;
                        var communityAnswersHtml = info.CommunityAnswersHtml;
                        var multipleChoiceHtml = communityAnswersHtml.querySelector(".hanoicollab-community-answers-multiple-choice-contents");
                        var elem = HanoiCollabGlobals.Document.createElement("div");
                        for (var key of Object.keys(communityAnswers))
                        {
                            if (communityAnswers[key].Alpha)
                            {
                                var p = HanoiCollabGlobals.Document.createElement("p");
                                p.innerHTML = `<b>${communityAnswers[key].Alpha}</b> (${communityAnswers[key].length}): ${EscapeHtml(communityAnswers[key].slice(0, Math.min(communityAnswers[key].length, 10)).join(", "))}`;
                                elem.appendChild(p);
                            }
                        }
                        multipleChoiceHtml.innerHTML = elem.innerHTML;
                    }

                    if (info.IsWritten())
                    {
                        var communityAnswers = info.CommunityAnswers;
                        var communityAnswersHtml = info.CommunityAnswersHtml;
                        var writtenSelect = communityAnswersHtml.querySelector(".hanoicollab-community-answers-written-select");
                        var newSelect = HanoiCollabGlobals.Document.createElement("select");
                        for (var ans of communityAnswers.sort(
                            function(a, b){return (a.Answer.length != b.Answer.length) ? a.Answer.length - b.Answer.length : a.User.localeCompare(b.User)}))
                        {
                            var option = HanoiCollabGlobals.Document.createElement("option");
                            option.value = ans.User;
                            option.innerText = `${ans.User} (${ans.Answer.length}) characters`;
                            newSelect.appendChild(option);
                        }
                        writtenSelect.innerHTML = newSelect.innerHTML;
                        info.UpdateWrittenSelect(writtenSelect);
                    }
                }

                result.push(info);
            }

            return result;
        }
        break;
        default:
        {
            return [];
        }
    }
}

function SetupEventHooks(q)
{
    switch (HanoiCollabGlobals.Provider)
    {
        case "azota.vn":
        {
            function Update()
            {
                // Set timeout, to wait for other event handlers:
                setTimeout(function()
                {
                    var answer = q.GetUserAnswer();
                    q.SetUserAnswer(answer);    
                }, 100);
            }
            if (q.Type == "multipleChoice")
            {
                q.HtmlElement.querySelector(".list-answer").addEventListener("click", Update);
            }
            else
            {
                q.HtmlElement.querySelector("textarea").addEventListener("blur", Update);
            }
            q.HtmlElement.querySelector(".hanoicollab-clear-button").addEventListener("click", Update);
        }
        break;
        default:
        break;
    }
}

function SetupElementHooks()
{
    var questions = HanoiCollabGlobals.Questions;
    for (/* new var in each interation */let q of questions)
    {
        var button = HanoiCollabGlobals.Document.createElement("button");
        button.innerText = "Clear";
        button.className = "hanoicollab-clear-button";
        button.addEventListener("click", function() {q.ClearUserAnswer();});
        q.HtmlElement.appendChild(button);

        SetupEventHooks(q);
    }
}

async function SetupExamConnection()
{
    if (HanoiCollabGlobals.ExamConnection)
    {
        return HanoiCollabGlobals.ExamConnection;
    }

    var connection = new signalR
        .HubConnectionBuilder()
        .withUrl(HanoiCollabGlobals.Server + "hubs/exam", { accessTokenFactory: GetToken })
        .build();
    
    HanoiCollabGlobals.ExamConnection = connection;

    var questions = HanoiCollabGlobals.Questions;

    connection.on("InitializeExam", async function(onlineQuestions)
    {
        for (var q of questions)
        {
            q.CommunityAnswers = [];

            if (q.Type == "multipleChoice" || q.Type == "hybrid")
            {
                for (var a of q.Answers)
                {
                    q.CommunityAnswers[a.Id] = [];
                    q.CommunityAnswers[a.Id].Alpha = a.Alpha; 
                }
            }
            
            if (q.Type == "written" || q.Type == "hybrid")
            {
                q.CommunityAnswers = [];
            }
        }

        for (var i = 0; i < onlineQuestions.length; ++i)
        {
            var question = questions.find(function (q)
            {
                return q.Id == onlineQuestions[i].QuestionId;
            });
            if (question.CommunityAnswers[onlineQuestions[i].Answer])
            {
                question.CommunityAnswers[onlineQuestions[i].Answer].push(onlineQuestions[i].UserId);
            }
            else
            {
                question.CommunityAnswers.push({User: onlineQuestions[i].UserId, Answer: onlineQuestions[i].Answer});   
            }
        }

        for (var q of questions)
        {
            q.UpdateCommunityAnswersHtml();
            var ans = q.GetUserAnswer();
            if (ans != null)
            {
                await q.SendUserAnswer(ans);
            }
        }

        console.log(HanoiCollabGlobals.Questions);
    });

    connection.on("ReceiveAnswer", function(onlineQuestion)
    {
        var question = questions.find(function (q)
        {
            return q.Id == onlineQuestion.QuestionId;
        });

        if (onlineQuestion.OldAnswer)
        {
            if (question.CommunityAnswers[onlineQuestion.OldAnswer])
            {
                var arr = question.CommunityAnswers[onlineQuestion.OldAnswer];
                arr.splice(arr.indexOf(onlineQuestion.UserId), 1);
            }
            // null answer, must delete.
            else if (!onlineQuestion.Answer)
            {
                var arr = question.CommunityAnswers;
                var idx = arr.findIndex(function(ans){return ans.User == onlineQuestion.UserId;});
                if (idx != -1)
                {
                    arr.splice(idx, 1);
                }
            }
        }
        if (question.CommunityAnswers[onlineQuestion.Answer])
        {
            question.CommunityAnswers[onlineQuestion.Answer].push(onlineQuestion.UserId);
        }
        // Prevent null answers, which are actually deletions.
        else if (onlineQuestion.Answer)
        {
            var arr = question.CommunityAnswers;
            var idx = arr.findIndex(function(ans){return ans.User == onlineQuestion.UserId;});
            if (idx != -1)
            {
                arr[idx].Answer = onlineQuestion.Answer;
            }
            else
            {
                question.CommunityAnswers.push({User: onlineQuestion.UserId, Answer: onlineQuestion.Answer});
            }
        }

        question.UpdateCommunityAnswersHtml();
    });

    await connection.start();

    await connection.invoke("JoinExam", GetFormId());

    connection.DeliberateClose = false;

    connection.onclose(function()
    {
        if (connection.DeliberateClose)
        {
            return;
        }
        console.log("Reconnecting...");
        var handle = setInterval(async function()
        {
            await connection.start();
            await HanoiCollabGlobals.ExamConnection.invoke("JoinExam", GetFormId());
            clearInterval(handle);
        }, 5000);
    });

    return connection;
}

async function TerminateExamConnection()
{
    if (HanoiCollabGlobals.ExamConnection)
    {
        await HanoiCollabGlobals.ExamConnection.invoke("LeaveExam", GetFormId());
        HanoiCollabGlobals.ExamConnection.DeliberateClose = true;
        await HanoiCollabGlobals.ExamConnection.stop();
        HanoiCollabGlobals.ExamConnection = null;
    }
}

function SetupCommunityAnswersUserInterface()
{
    switch(HanoiCollabGlobals.Provider)
    {
        case "azota.vn":
        default:
        {
            for (var q of HanoiCollabGlobals.Questions)
            {
                q.HtmlElement.appendChild(q.CommunityAnswersHtml);
            }
        }
        break;
    }
}

(async function() 
{
    if (!(top === self))
    {
        return;
    }
    HanoiCollabGlobals.Provider = location.hostname;
    HanoiCollabGlobals.Channel = location.href;
    await WaitForDocumentReady();
    
    var oldPushState = window.history.pushState;
    window.history.pushState = function(state, title, url)
    {
        if (url)
        {
            // Should never return, page reloaded.
            location.href = url;
        }
        oldPushState(state, title, url);
    }

    await SetupSandbox();
    SetupKeyBindings();
    SetupStyles();
    await SetupServer();
    await SetupIdentity();
    await SetupChatConnection();
    await SetupChatUserInterface();
    var isTest = await WaitForTestReady();
    HanoiCollabGlobals.OnIdentityChange = async function()
    {
        await TerminateChatConnection();
        await SetupChatConnection();
        await SetupChatUserInterface();
        if (isTest)
        {
            await TerminateExamConnection();
            await SetupExamConnection();    
        }
    }
    if (isTest)
    {
        HanoiCollabGlobals.Questions = GetQuestions();
        SetupElementHooks();
        await SetupExamConnection();
        SetupCommunityAnswersUserInterface();
    }
    $(window).on("beforeunload", async function() 
    {
        await TerminateChatConnection();
        await TerminateExamConnection();
    });
})();