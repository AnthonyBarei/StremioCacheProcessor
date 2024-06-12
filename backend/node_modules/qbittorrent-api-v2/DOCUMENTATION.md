# Documentation *1.2.0*

See [qBittorrent's API documentation](https://github.com/qbittorrent/qBittorrent/wiki/Web-API-Documentation) for more info.

### Authentication


#### connect(host, username, password) 

Login to qBittorrent




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| host | `string`  | Host name of your qBittorrent instance | &nbsp; |
| username | `string`  | Username used to access the WebUI | &nbsp; |
| password | `string`  | Password used to access the WebUI | &nbsp; |




##### Returns


- `Promise<Object>`  API methods

### Application

#### appVersion() 

Get application version






##### Returns


- `Promise<string>`  The response is a string with the application version, e.g. v4.1.3



#### apiVersion() 

Get API version






##### Returns


- `Promise<string>`  The response is a string with the WebAPI version, e.g. 2.0



#### buildInfo() 

Get build info






##### Returns


- `Promise<BuildInfo>`  Object containing build info



#### shutdown() 

Shutdown application






##### Returns


- `Void`



#### preferences() 

Get application preferences






##### Returns


- `Promise<Preferences>`  Object containing the application's settings



#### defaultSavePath() 

Get default save path






##### Returns


- `Promise<string>`  Default save path, e.g. C:/Users/Dayman/Downloads

### Log

#### log(normal, info, warning, critical, lastKnownId) 

Get log




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| normal | `boolean`  | Include normal messages (default: `true`) | &nbsp; |
| info | `boolean`  | Include info messages (default: `true`) | &nbsp; |
| warning | `boolean`  | Include warning messages (default: `true`) | &nbsp; |
| critical | `boolean`  | Include critical messages (default: `true`) | &nbsp; |
| lastKnownId | `number`  | Exclude messages with "message id" <= `lastKnownId` (default: `-1`) | &nbsp; |




##### Returns


- `Promise<Array<Log>>`  Logs



#### peerLog(lastKnownId) 

Get peer log




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| lastKnownId | `number`  | Exclude messages with "message id" <= `lastKnownId` (default: `-1`) | &nbsp; |




##### Returns


- `Promise<Array<PeerLog>>`  Peer logs

### Sync

#### syncMainData(rid) 

Get main data




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| rid | `number`  | Response ID. If not provided, rid=0 will be assumed. If the given rid is different from the one of last server reply, `full_update` will be `true` | &nbsp; |




##### Returns


- `Promise<MainData>`  Main data



#### syncPeersData(hash, rid) 

Get torrent peers data




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | Torrent hash | &nbsp; |
| rid | `number`  | Response ID. If not provided, rid=0 will be assumed. If the given rid is different from the one of last server reply, `full_update` will be `true` | &nbsp; |




##### Returns


- `Promise<PeerData>`  Peer data

### Transfer info

#### transferInfo() 

Get global transfer info






##### Returns


- `Promise<TransferInfo>`  Transfer info



#### speedLimitsMode() 

Get alternative speed limits state






##### Returns


- `Promise<number>`  The response is 1 if alternative speed limits are enabled, 0 otherwise



#### toggleSpeedLimitsMode() 

Toggle alternative speed limits






##### Returns


- `Void`



#### globalDownloadLimit() 

Get global download limit






##### Returns


- `Promise<number>`  Current global download speed limit in bytes/second; this value will be zero if no limit is applied



#### setGlobalDownloadLimit(limit) 

Set global download limit




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| limit | `number`  | The global download speed limit to set in bytes/second | &nbsp; |




##### Returns


- `Void`



#### globalUploadLimit() 

Get global upload limit






##### Returns


- `Promise<number>`  Current global upload speed limit in bytes/second; this value will be zero if no limit is applied



#### setGlobalUploadLimit(limit) 

Set global upload limit




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| limit | `number`  | The global upload speed limit to set in bytes/second | &nbsp; |




##### Returns


- `Void`



#### banPeers(peers) 

Ban peers




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| peers | `string`  | The peer to ban, or multiple peers separated by a pipe `|`. Each peer is a colon-separated `host:port` | &nbsp; |




##### Returns


- `Void`

### Torrent management

#### torrents(filter, category, sort, reverse, limit, offset, hashes) 

Get torrent list




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| filter | `string`  | Filter torrent list | &nbsp; |
| category | `string`  | Get torrents with the given category (empty string means "without category"; null parameter means "any category") | &nbsp; |
| sort | `string`  | Sort torrents by given key | &nbsp; |
| reverse | `boolean`  | Enable reverse sorting | &nbsp; |
| limit | `number`  | Limit the number of torrents returned | &nbsp; |
| offset | `number`  | Set offset (if less than 0, offset from end) | &nbsp; |
| hashes | `string`  | Filter by hashes. Can contain multiple hashes separated by | | &nbsp; |




##### Returns


- `Promise<Array<Torrent>>`  Torrents



#### properties(hash) 

Get torrent generic properties




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent you want to get the generic properties of | &nbsp; |




##### Returns


- `Promise<TorrentInfo>`  Torrent properties



#### trackers(hash) 

Get torrent trackers




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent you want to get the trackers of | &nbsp; |




##### Returns


- `Promise<Array<Tracker>>`  Torrent trackers



#### webseeds(hash) 

Get torrent webseeds




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent you want to get the webseeds of | &nbsp; |




##### Returns


- `Promise<Array<Webseed>>`  Torrent webseeds



#### files(hash) 

Get torrent contents




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent you want to get the contents of | &nbsp; |




##### Returns


- `Promise<Array<Content>>`  Torrent contents



#### pieceStates(hash) 

Get torrent pieces' states




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent you want to get the pieces' states of | &nbsp; |




##### Returns


- `Promise<Array<number>>`  States (integers) of all pieces (in order) of the torrent



#### pieceHashes(hash) 

Get torrent pieces' hashes




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent you want to get the pieces' hashes of | &nbsp; |




##### Returns


- `Promise<Array<string>>`  Hashes (strings) of all pieces (in order) of the torrent



#### pauseTorrents(hashes) 

Pause one or several torrents




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to pause. It can contain multiple hashes separated by |, to pause multiple torrents, or set to 'all', to pause all torrents | &nbsp; |




##### Returns


- `Void`



#### resumeTorrents(hashes) 

Resume one or several torrents




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to resume. It can contain multiple hashes separated by |, to resume multiple torrents, or set to 'all', to resume all torrents | &nbsp; |




##### Returns


- `Void`



#### deleteTorrents(hashes, deleteFile) 

Delete one or several torrents




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to delete. It can contain multiple hashes separated by |, to delete multiple torrents, or set to 'all', to delete all torrents | &nbsp; |
| deleteFile | `boolean`  | If set to `true`, the downloaded data will also be deleted, otherwise has no effect | &nbsp; |




##### Returns


- `Void`



#### recheckTorrents(hashes) 

Recheck one or several torrents




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to recheck. It can contain multiple hashes separated by |, to recheck multiple torrents, or set to 'all', to recheck all torrents | &nbsp; |




##### Returns


- `Void`



#### reannounceTorrents(hashes) 

Reannounce one or several torrents




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to reannounce. It can contain multiple hashes separated by |, to reannounce multiple torrents, or set to 'all', to reannounce all torrents | &nbsp; |




##### Returns


- `Void`



#### editTrackers(hash, origUrl, newUrl) 

Edit trackers




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent | &nbsp; |
| origUrl | `string`  | The tracker URL you want to edit | &nbsp; |
| newUrl | `string`  | The new URL to replace the `origUrl` | &nbsp; |




##### Returns


- `Void`



#### removeTrackers(hash, url) 

Remove trackers




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent | &nbsp; |
| url | `string`  | URLs to remove, separated by `|` | &nbsp; |




##### Returns


- `Void`



#### addPeers(hashes, peers) 

Add peers




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hash of the torrent, or multiple hashes separated by a pipe `|` | &nbsp; |
| peers | `string`  | The peer to add, or multiple peers separated by a pipe `|`. Each peer is a colon-separated `host:port` | &nbsp; |




##### Returns


- `Void`



#### addTrackers(hash, urls) 

Add trackers to torrent




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent | &nbsp; |
| urls | `string`  | URLs of the trackers, separated by a newline `\n` | &nbsp; |




##### Returns


- `Void`



#### increasePriority(hashes) 

Increase torrent priority




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to increase the priority of. It can contain multiple hashes separated by `|`, to increase the priority of multiple torrents, or set to 'all', to increase the priority of all torrents | &nbsp; |




##### Returns


- `Void`



#### decreasePriority(hashes) 

Decrease torrent priority




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to decrease the priority of. It can contain multiple hashes separated by `|`, to decrease the priority of multiple torrents, or set to 'all', to decrease the priority of all torrents | &nbsp; |




##### Returns


- `Void`



#### maxPriority(hashes) 

Maximal torrent priority




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set to the maximum priority. It can contain multiple hashes separated by `|`, to set multiple torrents to the maximum priority, or set to 'all', to set all torrents to the maximum priority | &nbsp; |




##### Returns


- `Void`



#### minPriority(hashes) 

Minimal torrent priority




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set to the minimum priority. It can contain multiple hashes separated by `|`, to set multiple torrents to the minimum priority, or set to 'all', to set all torrents to the minimum priority | &nbsp; |




##### Returns


- `Void`



#### setFilePriority(hash, id, priority) 

Set file priority




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent | &nbsp; |
| id | `string`  | File ids, separated by `|` | &nbsp; |
| priority | `number`  | File priority to set | &nbsp; |




##### Returns


- `Void`



#### downloadLimit(hashes) 

Get torrent download limit




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents. It can contain multiple hashes separated by `|` or set to 'all' | &nbsp; |




##### Returns


- `Void`



#### setDownloadLimit(hashes, limit) 

Set torrent download limit




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set the download limit. It can contain multiple hashes separated by `|`, to set the download limit of multiple torrents, or set to 'all', to set all torrents the download limit | &nbsp; |
| limit | `string`  | Download speed limit in bytes per second you want to set | &nbsp; |




##### Returns


- `Void`



#### setShareLimit(hashes, ratioLimit, seedingTimeLimit) 

Set torrent share limit




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set the share limit. It can contain multiple hashes separated by `|`, to set the share limit of multiple torrents, or set to 'all', to set all torrents the share limit | &nbsp; |
| ratioLimit | `string`  | Max ratio the torrent should be seeded until. `-2` means the global limit should be used, `-1` means no limit | &nbsp; |
| seedingTimeLimit | `string`  | Max amount of time the torrent should be seeded. `-2` means the global limit should be used, `-1` means no limit | &nbsp; |




##### Returns


- `Void`



#### uploadLimit(hashes) 

Get torrent upload limit




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents. It can contain multiple hashes separated by `|` or set to 'all' | &nbsp; |




##### Returns


- `Void`



#### setUploadLimit(hashes, limit) 

Set torrent upload limit




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set the upload limit. It can contain multiple hashes separated by `|`, to set the upload limit of multiple torrents, or set to 'all', to set all torrents the upload limit | &nbsp; |
| limit | `string`  | Upload speed limit in bytes per second you want to set | &nbsp; |




##### Returns


- `Void`



#### setLocation(hashes, location) 

Set torrent location




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set the location. It can contain multiple hashes separated by `|`, to set the location of multiple torrents, or set to 'all', to set all torrents the location | &nbsp; |
| location | `string`  | Location to download the torrent to. If the location doesn't exist, the torrent's location is unchanged | &nbsp; |




##### Returns


- `Void`



#### rename(hash, name) 

Set torrent name




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent | &nbsp; |
| name | `string`  | New torrent name | &nbsp; |




##### Returns


- `Void`



#### setCategory(hashes, category) 

Set torrent category




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set the category. It can contain multiple hashes separated by `|`, to set the category of multiple torrents, or set to 'all', to set the category of all torrents | &nbsp; |
| category | `string`  | The torrent category you want to set | &nbsp; |




##### Returns


- `Void`



#### categories() 

Get all categories






##### Returns


- `Promise<Categories>`  Categories in JSON format



#### createCategory(category, savePath) 

Add new category




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| category | `string`  | The category you want to create | &nbsp; |
| savePath | `string`  | Save path of the category | &nbsp; |




##### Returns


- `Void`



#### editCategory(category, savePath) 

Edit category




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| category | `string`  | The category you want to edit | &nbsp; |
| savePath | `string`  | Save path of the category | &nbsp; |




##### Returns


- `Void`



#### removeCategories(categories) 

Remove categories




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| categories | `string`  | Category you want to remove. It can contain multiple cateogies separated by a newline `\n` | &nbsp; |




##### Returns


- `Void`



#### addTags(hashes, tags) 

Add torrent tags




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to add tags to. It can contain multiple hashes separated by `|`, to add tags to multiple torrents, or set to 'all', to add the tags of all torrents | &nbsp; |
| tags | `string`  | The list of tags you want to add to passed torrents | &nbsp; |




##### Returns


- `Void`



#### removeTags(hashes, tags) 

Remove torrent tags




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to remove tags to. It can contain multiple hashes separated by `|`, to remove tags to multiple torrents, or set to 'all', to remove the tags of all torrents | &nbsp; |
| tags | `string`  | Category you want to remove. It can contain multiple cateogies separated by a newline `\n` | &nbsp; |




##### Returns


- `Void`



#### tags() 

Get all tags






##### Returns


- `Promise<Array<string>>`  Tags



#### createTags(tags) 

Create tags




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| tags | `string`  | List of tags you want to create. Can contain multiple tags separated by `,` | &nbsp; |




##### Returns


- `Void`



#### deleteTags(tags) 

Delete tags




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| tags | `string`  | List of tags you want to delete. Can contain multiple tags separated by `,` | &nbsp; |




##### Returns


- `Void`



#### setAutoManagement(hashes, enable) 

Set automatic torrent management




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set automatic torrent management. It can contain multiple hashes separated by `|`, to set automatic torrent management of multiple torrents, or set to 'all', to set automatic torrent management of all torrents | &nbsp; |
| enable | `boolean`  | Enable automatic torrent management or not for the torrents listed in `hashes` | &nbsp; |




##### Returns


- `Void`



#### toggleSequentialDownload(hashes) 

Toggle sequential download




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to toggle sequential download for. It can contain multiple hashes separated by `|`, to toggle sequential download for multiple torrents, or set to 'all', to toggle sequential download for all torrents | &nbsp; |




##### Returns


- `Void`



#### toggleFirstLastPiecePrio(hashes) 

Set first/last piece priority




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to toggle the first/last piece priority for. It can contain multiple hashes separated by `|`, to toggle the first/last piece priority for multiple torrents, or set to 'all', to toggle the first/last piece priority for all torrents | &nbsp; |




##### Returns


- `Void`



#### setForceStart(hashes, value) 

Set force start




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set force start. It can contain multiple hashes separated by `|`, to set force start of multiple torrents, or set to 'all', to set force start of all torrents | &nbsp; |
| value | `boolean`  | Enable force start or not for the torrents listed in `hashes` | &nbsp; |




##### Returns


- `Void`



#### setSuperSeeding(hashes, value) 

Set super seeding




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hashes | `string`  | The hashes of the torrents you want to set super seeding. It can contain multiple hashes separated by `|`, to set super seeding of multiple torrents, or set to 'all', to set super seeding of all torrents | &nbsp; |
| value | `boolean`  | Enable super seeding or not for the torrents listed in `hashes` | &nbsp; |




##### Returns


- `Void`



#### renameFile(hash, id, name) 

Rename file




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| hash | `string`  | The hash of the torrent | &nbsp; |
| id | `number`  | The id of the file to rename | &nbsp; |
| name | `string`  | The new name to use for the file | &nbsp; |




##### Returns


- `Void`

### Search

#### startSearch(pattern, plugins, category) 

Start search




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| pattern | `string`  | Pattern to search for (e.g. "Ubuntu 18.04") | &nbsp; |
| plugins | `string`  | Plugins to use for searching (e.g. "legittorrents"). Supports multiple plugins separated by `|`. Also supports 'all' and 'enabled' | &nbsp; |
| category | `string`  | Categories to limit your search to (e.g. "legittorrents"). Available categories depend on the specified plugins. Also supports 'all' | &nbsp; |




##### Returns


- `Promise<SearchJob>`  Search ID as JSON



#### stopSearch(id) 

Stop search




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| id | `number`  | ID of the search job | &nbsp; |




##### Returns


- `Void`



#### searchStatus([id]) 

Get search status




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| id | `number`  | ID of the search job. If not specified, all search jobs are returned | *Optional* |




##### Returns


- `Promise<Array<SearchStatus>>`  Status of the search jobs



#### searchResults(id[, limit, offset]) 

Get search results




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| id | `number`  | ID of the search job | &nbsp; |
| limit | `number`  | Max number of results to return. 0 or negative means no limit | *Optional* |
| offset | `number`  | Result to start at. A negative number means count backwards (e.g. -2 returns the 2 most recent results) | *Optional* |




##### Returns


- `Promise<SearchResults>`  Search results



#### deleteSearch(id) 

Delete search




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| id | `number`  | ID of the search job | &nbsp; |




##### Returns


- `Void`



#### searchCategories([pluginName]) 

Get search categories




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| pluginName | `string`  | Name of the plugin (e.g. "legittorrents"). Also supports 'all' and 'enabled' | *Optional* |




##### Returns


- `Promise<Array<string>>`  List of categories



#### searchPlugins() 

Get search plugins






##### Returns


- `Promise<Array<SearchPlugin>>`  List of plugins



#### installPlugin(sources) 

Install search plugin




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| sources | `string`  | Url or file path of the plugin to install. Supports multiple sources separated by `|` | &nbsp; |




##### Returns


- `Void`



#### uninstallPlugin(names) 

Uninstall search plugin




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| names | `string`  | Name of the plugin to uninstall (e.g. "legittorrents"). Supports multiple names separated by `|` | &nbsp; |




##### Returns


- `Void`



#### enablePlugin(names, enable) 

Enable search plugin




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| names | `string`  | Name of the plugin to enable/disable (e.g. "legittorrents"). Supports multiple names separated by `|` | &nbsp; |
| enable | `boolean`  | Whether the plugins should be enabled | &nbsp; |




##### Returns


- `Void`



#### updatePlugins() 

Update search plugins






##### Returns


- `Void`
