/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { PassThrough, Transform } from 'node:stream'

import type { AppLoadContext, EntryContext } from '@remix-run/node'
import { createReadableStreamFromReadable } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { NonceProvider } from '#/utils/nonce-provider'

const ABORT_DELAY = 5_000

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  loadContext: AppLoadContext,
) {
  return isbot(request.headers.get('user-agent') || '')
    ? handleBotRequest(
      request,
      responseStatusCode,
      responseHeaders,
      remixContext,
      loadContext,
    )
    : handleBrowserRequest(
      request,
      responseStatusCode,
      responseHeaders,
      remixContext,
      loadContext,
    )
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext,
) {
  const nonce = loadContext.cspNonce ? String(loadContext.cspNonce) : ''
  return new Promise((resolve, reject) => {
    let shellRendered = false
    const stream = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </NonceProvider>,
      {
        nonce,
        onAllReady() {
          shellRendered = true
          const body = new PassThrough()

          // find/replace all instances of the string "data-evt-" with ""
          // this is a bit of a hack because React won't render the "onload"
          // prop, which we use for blurrable image
          const dataEvtTransform = new Transform({
            transform(chunk, encoding, callback) {
              const string = chunk.toString()
              const replaced = string.replace(/data-evt-/g, `nonce="${nonce}" `)
              callback(null, replaced)
            },
          })

          stream.pipe(dataEvtTransform).pipe(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )

          stream.pipe(body)
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        },
      },
    )

    setTimeout(stream.abort, ABORT_DELAY)
  })
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext,
) {
  const nonce = loadContext.cspNonce ? String(loadContext.cspNonce) : ''
  return new Promise((resolve, reject) => {
    let didError = false
    const stream = renderToPipeableStream(
      <NonceProvider value={nonce}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </NonceProvider>,
      {
        nonce,
        // use onShellReady to wait until a suspense boundary is triggered
        onShellReady() {
          responseHeaders.set('Content-Type', 'text/html; charset=UTF-8')
          const body = new PassThrough()

          // find/replace all instances of the string "data-evt-" with ""
          // this is a bit of a hack because React won't render the "onload"
          // prop, which we use for blurrable image
          const dataEvtTransform = new Transform({
            transform(chunk, encoding, callback) {
              const string = chunk.toString()
              const replaced = string.replace(/data-evt-/g, `nonce="${nonce}" `)
              callback(null, replaced)
            },
          })

          stream.pipe(dataEvtTransform).pipe(body)
          resolve(
            new Response(createReadableStreamFromReadable(body), {
              status: didError ? 500 : responseStatusCode,
              headers: responseHeaders,
            }),
          )
        },
        onShellError(err: unknown) {
          reject(err)
        },
        onError(err: unknown) {
          didError = true
          console.error(err)
        },
      },
    )
    setTimeout(() => stream.abort(), ABORT_DELAY)
  })
}
