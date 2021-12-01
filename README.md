# file-service-for-share

This file service only serves files. Files already have to exist using the same system as the file-service. This service is only for retreiving those files by their `share://` instead of their proper virtual file UUID.

## Environment variables

* `SHARE_FOLDER`: this is the path to the folder with the files to serve. This can also be the folder of the file service. (default: `/share/`)
* `FILES_GRAPH`: graph where the file metadata is stored. This has to match with the file services graph, or the one used by the service storing the metadata. (default: `http://mu.semte.ch/files/`).

## API

This follows the API of the [file-service](https://github.com/mu-semtech/file-service) closely, but only for the getting of file metadata and downloading the file.

### GET /files/:uri

Get metadata of the file with the given physical file URI. NOTE: the `:uri` needs to be a URL encoded string of the URI, because it could contain special characters that could interfere with the URL.

**Response 200 OK**

Returns the metadata of the file with the given URI.

**Response 404 Bad Request**

If a file with the given URI cannot be found.

### GET /files/:uri/download

Download the content of the file with the given URI. NOTE: the `:uri` needs to be a URL encoded string of the URI, because it could contain special characters that could interfere with the URL.

*Query paramaters*

*   `name` (optional): name for the downloaded file (e.g. `/files/share%3A%2F%2F614872344579/download?name=report.pdf`)

**Response 200 Ok**

Expected response, the file is returned.

**Response 404 Bad Request**

No file could be found with the given uri (on disk).

**Response 500 Server error**

This error will never be thrown, because no database lookup is necessary.

