# file-share-sync-service

This file service only serves files. This service is only for retreiving those files by their `share://`.

## Environment variables

* `SHARE_FOLDER`: this is the path to the folder with the files to serve. This can also be the folder of the file service. (default: `/share/`)
* `ALLOWED_ACCOUNTS`: 'http://foo,http://bar' (default: 'http://services.lblod.info/diff-consumer/account')
## API

### GET /download

Download the content of the file.

*Query paramaters*

*   `uri` (required): name for the downloaded file (e.g. `/download?uri=share://foo.pdf`)
*   `name` (optional): name for the downloaded file (e.g. `/download?name=report.pdf`)

**Response 200 Ok**

Expected response, the file is returned.

**Response 400 Bad Request**

Bad request, or no access allowed

**Response 404 Bad Request**

No file could be found with the given uri (on disk).
