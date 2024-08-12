import * as React from 'react'
import { cx } from '#/utils/cva.config'

const isServer = typeof document === 'undefined'

export function BlurImage({
  img,
  blurDataUrl,
  className,
  ...rest
}: {
  img: React.ReactElement<React.ImgHTMLAttributes<HTMLImageElement>>
  blurDataUrl?: string
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId()
  const [visible, setVisible] = React.useState(() => {
    if (isServer)
      return false

    // on the client, it's possible the images has already finished loading.
    // we've got the data-evt-onload attribute on the image
    // (which our entry.server replaces with simply "onload") which will remove
    // the class "opacity-0" from the image once it's loaded. So we'll check
    // if the image is already loaded and if so, we know that visible should
    // initialize to true.
    const el = document.getElementById(id)
    return el instanceof HTMLImageElement && !el.classList.contains('opacity-0')
  })
  const jsImgElRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (!jsImgElRef.current)
      return
    if (jsImgElRef.current.complete) {
      setVisible(true)
      return
    }

    let current = true
    jsImgElRef.current.addEventListener('load', () => {
      if (!jsImgElRef.current || !current)
        return
      setTimeout(() => {
        setVisible(true)
      }, 0)
    })

    return () => {
      current = false
    }
  }, [])

  // eslint-disable-next-line react/no-clone-element
  const jsImgEl = React.cloneElement(img, {
    // @ts-expect-error ref is populated once React hydrates
    'ref': jsImgElRef,
    id,
    'suppressHydrationWarning': true,

    // React doesn't like the extra onload prop the server's going to send,
    // but it also doesn't like an onload prop and recommends onLoad instead.
    // but we want to use the onload prop because it's a bit more performant
    // and as a result it's possible the user will never see the blurred image
    // at all which would be great. So we suppress the warning here and we use
    // this funny data-evt-prefixed attribute which our server renderer will
    // remove for us (check entry.server).
    'data-evt-onload': isServer
      ? 'this.classList.remove(\'opacity-0\')'
      : undefined,
    'className': cx(
      'absolute size-full',
      img.props.className,
      'transition-opacity',
      {
        'opacity-0': !visible,
      },
    ),
  })

  return (
    <div className={cx(className, 'relative')} {...rest}>
      {blurDataUrl
        ? (
            <>
              <img
                src={blurDataUrl}
                className={cx(img.props.className, 'absolute')}
                alt={img.props.alt}
              />
              <div className={cx(img.props.className, 'absolute backdrop-blur-xl')} />
            </>
          )
        : null}
      {jsImgEl}
      <noscript>{img}</noscript>
    </div>
  )
}
