# Stremio Cache Processor

Stremio Cache Processor is an intermediary application designed to monitor and interact with the Stremio cache in real-time. It provides a robust solution for file manipulation, leveraging either native Windows copy functionality or the qBittorrent API. Furthermore, it offers the capability to upload files to a local Plex server and initiate library scans to incorporate new media.

## Key Features

- Real-time Stremio cache monitoring
- File manipulation via Windows copy or qBittorrent
- File uploading to local NAS Shield Pro TV
- Plex library scanning for media addition
- Health checks for NordVPN, Stremio, and qBittorrent (not mandatory for application operation)

## Technology Stack

- Node.js for backend development
- Redis for efficient data storage
- Socket.io for real-time bidirectional event-based communication
- Axios for promise-based HTTP requests
- fs spawn to initiate file downloads
- React for frontend development

## Frontend

The frontend, developed using React, provides a user-friendly interface that displays media currently being played on Stremio. It also includes a configuration page for application settings.

## Installation & Setup

Instructions for setting up and running the project will be provided here.

## License

Details about the project's license will be provided here.