# Stremio Cache Processor

This project is a Node.js backend that monitors the Stremio cache for new files. It uses an API to check for downloads and can optionally use the qBittorrent API to download files via magnet links. Once downloaded, users can copy files from the Stremio cache. If qBittorrent was used, the file is already in the destination.

## Features

- Watchfolder to read Stremio cache
- Use qBittorrent API to download files through magnet links
- Copy files from Stremio cache or directly from qBittorrent destination
- Upload files to local NAS Shield Pro TV
- Scan Plex libraries to add media
- Server checks if NordVPN, Stremio, and qBittorrent are running (none are required for the app to run)

## Technologies Used

- Node.js
- Redis for storage
- Socket.io for real-time communication
- Axios for HTTP requests
- fs spawn to start the file when it is downloaded
- React for the frontend

## Frontend

The frontend is built with React and includes a main page to display media being played on Stremio and a configuration page to configure the app.

## Setup

Provide instructions on how to setup and run your project here.

## License

Include information about your license here.