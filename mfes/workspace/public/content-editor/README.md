# Content Editor

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/9858d61b7adf494a9e30afedb7c06739)](https://app.codacy.com/app/sunbird-bot/sunbird-content-editor?utm_source=github.com&utm_medium=referral&utm_content=project-sunbird/sunbird-content-editor&utm_campaign=Badge_Grade_Settings)
[![Build Status](https://travis-ci.org/project-sunbird/sunbird-content-editor.svg?branch=master)](https://travis-ci.org/project-sunbird/sunbird-content-editor)
[![npm version](https://badge.fury.io/js/%40project-sunbird%2Fcontent-editor.svg)](https://badge.fury.io/js/%40project-sunbird%2Fcontent-editor)

## Introduction
	
Sunbird's in-built content editor tool allows you to create Ekstep Content Markup Language(ECML) type of content.


## Step 1: Installation
 
 Download the content editor using the following command: 
```red
Run npm i @project-sunbird/content-editor
```

## Step 2: Configure the content editor

**Required configuration**
	
```js
window.context = {
{
  "user": {
    "id": " ",
    "name": "Admin",
    "orgIds": [  ],
    "organisations": {}
  },
  "sid": "xxx",
  "contentId": "do_xxx",
  "pdata": {
    "id": "",
    "ver": "1.11.0",
    "pid": ""
  },
  "tags": [],
  "channel": "xxx",
  "framework": "NCFCOPY",
  "ownershipType": [
    "createdBy",
    "createdFor"
  ],
  "uid": "xxx",
  "etags": {
    "app": [],
    "partner": [],
    "dims": []
  }
};
```
```js
window.config = {
  "baseURL": "",
  "apislug": "/action",
  "build_number": "1.11.0.1bb2ae8",
  "pluginRepo": "/content-plugins",
  "aws_s3_urls": [],
  "plugins": [
    {
      "id": "org.ekstep.sunbirdcommonheader",
      "ver": "1.6",
      "type": "plugin"
    }
  ],
  "corePluginsPackaged": true,
  "dispatcher": "local",
  "localDispatcherEndpoint": "",
  "previewURL": "/content/preview/preview.html",
  "modalId": "contentEditor",
  "alertOnUnload": true,
  "headerLogo": "https://dev.open-sunbird.org/assets/images/sunbird_logo.png",
  "showHelp": false,
  "previewConfig": {},
  "pluginsRepoUrl": " ",
  "enableTelemetryValidation": false
}
```

| Property Name | Description | Property Type | Default Value | Example |
| --- | --- | --- |---|---|
| `user` | The user field contains four objects - user name, user ID, organization IDs and organization names. |object  | NA  |{"id":"95e4052d-abe8-477d-aebd-ad8e6de4bfc8","name":"Reviewer User","orgIds":["012363943890170242","ORG_001"],"organisations":{"ORG_001":"Sunbird","012363943890170242":"QA ORG"}} |
| `sid` | The string value that identifies the session |string | NA  | IYNPDoYY5aoWbv1Yre4Nfl_J8tResl_S |
| `contentId ` |The string value that identifies the content being created or modified |string | NA  |do_112699569941724161115|
| `pdata ` | The producer information. It contains three objects - producer ID, build version and the component ID| object | NA  | {"id":"dev.sunbird.portal","ver":"1.14.0","pid":"sunbird-portal.contenteditor"} |
| `tags ` | Encrypted dimension tags passed by respective channels| array | NA  | ["012363943890170242", "ORG_001"] |
| `channel ` | Channel that produces the event| string| NA  |b00bc992eg65f1a8s8fg3291e20efc8d|
| `framework ` | The content framework used to create the content|NA  | NCF, NCERT|
| `baseURL ` | The name of the host URL |string | NA  |
| `corePluginsPackaged ` | The configuration that enables the content editor to load plugins from a packaged script rather than individually| boolean|true  | true|
| `pluginRepo ` | The location from which plugins are loaded |string  | /plugins  |/plugins/v1/search|
| `dispatcher ` | The location where telemetry is logged | string| console | console, piwik, library |
| `keywordsLimit ` | The maximum size for the response keywords| number | 500 | 100|
| `plugins ` | An array for the plugins | array | NA | ex:`[{id:"org.sunbird.header",ver:"1.0",type:"plugin"}]`|
| `previewURL ` | The path of the content player previewer | string | NA |
| `showHelp ` | Used to show the help icon in the editor | boolean|false |
| `previewConfig ` | The configurations related to the content player preview. For details, refer [here](https://github.com/project-sunbird/sunbird-content-player) | string | false |
| `enableTelemetryValidation ` | Used to validate the telemetry events that are generated in the editors | boolean| false |
| `aws_s3_urls ` | If any content asset refers to any aws s3 url, configure the URLs here. The editor replaces those paths with `baseURL + assetReverseProxyUrl` |array| NA |"https://s3.ap-south-1.amazonaws.com/ekstep-public-dev/" | 
| `cloudStorage` |  It is `object` and which defines cloud storage configuration which contains provider & presigned_headers for diff service provider for example: Azure, AWS | object | ``` cloudStorage: { provider: azure, presigned_headers: { 'x-ms-blob-type': 'BlockBlob' // This header is specific to azure storage provider. } } ``` | The default configuration can be overwrite by passing empty headers. ***For example:*** If you don't want to pass any headers for AWS than pass as empty headers as below: ``` cloudStorage: { provider: '', presigned_headers: { } } ```


## Step 3: Integration

```js
  openContentEditor() {
    jQuery.fn.iziModal = iziModal;
    jQuery('#content-editor').iziModal({
      title: '',
      iframe: true,
      iframeURL: 'url', // content-editor node_moduels index.html path
      navigateArrows: false,
      fullscreen: false,
      openFullscreen: true,
      closeOnEscape: false,
      overlayClose: false,
      overlay: false,
      overlayColor: '',
      history: false,
      onClosing: () => {
        this._zone.run(() => {
          this.closeModal();
        });
      }
    });
```  

# How to Setup Sunbird Content Editor in your Local Machine

1. Clone the sunbird-content-editor repo from [here](https://github.com/project-sunbird/sunbird-content-editor)
2. Clone the sunbird-content-plugins repo from [here](https://github.com/project-sunbird/sunbird-content-plugins) 
3. Go to the root directory sunbird-content-editor.
4. Run `npm install` to install node modules.
3. `cd app` and run `bower install` to install bower components
5. Create a symlink to 'sunbird-content-plugins' (`ln -s ../sunbird-content-plugins plugins`)(Linux, mac)
for windows: use `mklink`
6. Configure the content editor [here](https://github.com/project-sunbird/sunbird-content-editor#how-to-configure-the-sunbird-content-editor)
7. Run `node app`
8. Open Chrome and visit this link: http://localhost:3000/app?contentId={{content_id}}  
*content_id*: Live/Draft content id created on Sunbird portal

sample link: http://localhost:3000/app?contentId=do_1124674880571

## Reference links

*How to setup Sunbird backend*: http://docs.sunbird.org/latest/developer-docs/installation/install_sbbackend/

*How to setup Editors in Sunbird portal*: http://docs.sunbird.org/latest/developer-docs/installation/install_sbportal/

*Sunbird API Reference*: http://docs.sunbird.org/latest/apis/

## ChangeLogs
For changes logs,refer [here](https://github.com/project-sunbird/sunbird-content-editor/releases) 

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/project-sunbird/sunbird-content-editor/blob/master/LICENSE) file for details

## Versioning
We use [SemVer](https://semver.org/) for versioning. For the versions available, see the [tags](https://github.com/project-sunbird/sunbird-content-editor/tags) on this repository.

## Any Issues?
We have an open and active [issue tracker](https://project-sunbird.atlassian.net/issues/). Please report any issues.


>For sunbird-content-editor demo, refer [here](https://staging.open-sunbird.org/workspace/content/create)   

