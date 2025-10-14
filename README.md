# file-share-sync-service

This service serves files, retrievable via their `share://` URI.

## Getting started
Add the service to your `docker-compose.yml`

``` yaml
services:
  fileshare:
    image: redpencil/file-share-sync:0.1.0
    volumes:
      - ./data/files:/share
```

## How-to guides
### How to enable file access for super users
By default the service only grants access to files as configured in mu-authorization. I.e. if the user has access to the share-URI in the triplestore, he can download the file.

To enable access for 'super consumers', enable the following environment variable on the service:

``` yaml
services:
  fileshare:
    image: redpencil/file-share-sync:0.1.0
    environment:
      ALLOW_MU_AUTH_SUDO: "true"
      ALLOW_SUPER_CONSUMER: "true"
    volumes:
      - ./data/files:/share
```

If the `mu-session-id` (session URI) of the request is linked to the `http://services.lblod.info/diff-consumer/account` account in the `http://mu.semte.ch/graphs/diff-producer/login` graph, the requester will be granted access to the files.

The allowed accounts can be configured via the `ALLOWED_ACCOUNTS` environment variable.

See the login endpoints of for example [lblod/delta-producer-publication-graph-maintainer](https://github.com/lblod/delta-producer-publication-graph-maintainer) or [kanselarij-vlaanderen/delta-producer-json-diff-file-publisher](https://github.com/kanselarij-vlaanderen/delta-producer-json-diff-file-publisher/blob/master/README.md#post-login) to link an account to the `mu-session-id`.

## Reference
### Configuration

The following environment variables can be configured on the service:
* `ALLOW_SUPER_CONSUMER`: flag to enable file access for superconsumers. Otherwise file access will only be granted as configured in mu-authorization (default: `false`). Superconsumers have their session linked to one of the `ALLOWED_ACCOUNTS`.
* `ALLOWED_ACCOUNTS`: Comma-separated list of allowed accounts to be considered superconsumer. Only relevant if `ALLOW_SUPER_CONSUMER` is enabled. E.g. `http://foo,http://bar` (default: `http://services.lblod.info/diff-consumer/account`)
* `SHARE_FOLDER`: path to the folder with the files to serve (default: `/share/`)

### API
#### GET /download

Download the content of the file.

**Query paramaters**

* `uri` (required): share URI of the file (e.g. `/download?uri=share://foo.pdf`)
* `name` (optional): name for the downloaded file (e.g. `/download?name=report.pdf`)

**Response**

Returns 200 OK on success.

Returns 400 Bad Request if `uri` query param is missing or requester doesn't have access to the file.

Returns 404 Not Found if file with the given URI cannot be found on disk.

