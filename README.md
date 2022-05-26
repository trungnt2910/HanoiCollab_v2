# HanoiCollab_v2 - Real-time quiz collaboration solution for small teams

## Client installation:
- HanoiCollab requires Tampermonkey, an extension for your browser. You can download Tampermonkey for [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) and [Google Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en). 
- After Tampermonkey has been downloaded, get HanoiCollab [here](https://bit.ly/HanoiCollabClient).
- Follow the setup instructions in the UI and create a HanoiCollab account.

## Server setup:
While the public HanoiCollab server (https://hanoicollab.herokuapp.com) is mostly functional, you might want to setup your own server. Here are the steps required:  
- Step 1: Install the [ASP.NET Core 6 Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/6.0).
- Step 2: Setup a MongoDB server. It can either be locally hosted or cloud-based. Note down your connection string.
For more details on getting a MongoDB connection string, refer to [this guide](https://www.mongodb.com/docs/guides/cloud/connectionstring/) if you're using MongoDB on the cloud (MongoDB Atlas), or [this guide](https://www.mongodb.com/docs/guides/server/drivers/) for local servers.
- Step 3: Create your `appsettings.json` HanoiCollab_v2. The `appsettings.json` file is located in the `HanoiCollab_v2` folder. A sample configuration file, [`appsettings.Sample.json`](HanoiCollab_v2/appsettings.Sample.json), is also provided. You can make a copy of that file and rename it to `appsettings.json`, but remember to change:
    + The `connectionString` field. Replace it with the MongoDB connection string you obtained during step 2.
    + The `JwtSecret` field. Replace it with any secret text to secure your server.

## Community
If you have any problems setting up HanoiCollab's client and/or server, would like quick support from HanoiCollab's developers, or just want to hang out with fellow users, don't hesitate to join our [Discord server](https://discord.gg/tDsux9HWPr).