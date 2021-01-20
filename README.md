# This is the English version inspired from https://github.com/LingyuCoder/SkyRTC (Alright reserved)

# A simple SkyRTC example

## Introduction

This is a demo that uses WebRTC to build audio, video, and text chat rooms in the browser

![index](./image/index.png)
![room](./image/room.png)

## Installation and use

Make sure you have Node.js, npm and git environment locally before use, install the Mongodb database and open the service.

```bash
git clone https://github.com/imu-hupeng/SkyRTC.git
cd SkyRTC
npm install
```

```bash
npm run start
```

If the above command reports an error, please try:

```bash
sudo node server.js
```

After that, visit [https://localhost/addAdmin](https://localhost/addAdmin) Create a user, pay attention to the https used here, if you are prompted "Your connection is not a private connection", please click "Advanced" -> "Continue to localhost (unsafe)"。

After creating a user, you can [https://localhost/](https://localhost/) log in and use this system。

## Function Description

Support online audio, video, and text chat for dividing the room, and provide file sharing function in the room

## Reference project

[SkyRTC project](https://github.com/LingyuCoder/SkyRTC)

[SkyRTC-client project](https://github.com/LingyuCoder/SkyRTC-client)
