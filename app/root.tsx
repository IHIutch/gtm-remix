import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { prisma } from "./utils/prisma.server";
import { unstable_defineLoader as defineLoader, LinksFunction, MetaFunction } from '@remix-run/node'
import { formatTime } from "./utils/functions";
import { BlurImage } from "./components/blur-image";
import dayjs from "dayjs";
import stylesHref from "./tailwind.css?url";

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const

const weekdayName = dayjs().format('dddd') as typeof DAYS_OF_WEEK[number]

export const shouldRevalidate = () => false;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      tagName: "link",
      rel: "preload",
      href: data?.data?.coverImage?.src,
      as: "image",
      fetchPriority: "high"
    },
  ];
};

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: stylesHref },
  ]
}

export const loader = defineLoader(async ({ request }) => {
  // const { hostname } = new URL(request.url)
  // const [tenant, domain, tld] = hostname.split(".")
  // console.log({ tenant, domain, tld })

  // if tld is undefined it means there was not subdomain
  // so we can redirect to another url and set a default tenant
  // or even redirect to a route where the tenant is not required
  // like a landing or login form
  // if (!tld) {
  //   throw new Response('Not Found', { status: 404 })
  // }


  const data = await prisma.restaurants.findUnique({
    where: {
      // customHost: tenant
      customHost: "whereslloyd"
    },
    omit: {
      id: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
    include: {
      menuItems: {
        orderBy: {
          position: 'asc'
        },
        omit: {
          restaurantId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
      menus: {
        orderBy: {
          position: 'asc'
        },
        omit: {
          restaurantId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
      sections: {
        orderBy: {
          position: 'asc'
        },
        omit: {
          restaurantId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }
    }
  })

  if (!data) {
    throw new Response('Not Found', { status: 404 })
  }
  return { data }

})

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-50">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { data } = useLoaderData<typeof loader>()

  return (
    <div>
      <div className="aspect-[16/9] sm:aspect-[21/9] relative flex flex-col">
        {data?.coverImage?.src ?
          <div className="absolute size-full z-0">
            <img
              src={data.coverImage.src}
              alt=""
              className="size-full object-cover"
              fetchPriority="high"
            />
          </div>
          : null}
        <div className="max-w-screen-lg mx-auto z-10 relative mt-auto w-full pb-8 px-4">
          <h1 className="mb-4 text-5xl text-white font-bold [text-shadow:0_2px_1px_black]">{data.name}</h1>
          <div className="flex items-center text-white gap-8">
            {data?.phone?.length > 0 ? (
              <div className="flex gap-2">
                {/* <Icon as={PhoneIcon} /> */}
                <span>{data?.phone?.[0]}</span>
              </div>
            ) : null}

            {data?.phone?.length > 0 ? (
              <div className="flex gap-2">
                {/* <Icon as={PhoneIcon} /> */}
                {data?.hours?.[weekdayName]?.isOpen ? (
                  <span>
                    {data.hours?.[weekdayName]?.openTime ?
                      formatTime(
                        data.hours?.[weekdayName]?.openTime || ''
                      ) : null}{' '}
                    -{' '}
                    {data.hours?.[weekdayName]?.closeTime ?
                      formatTime(
                        data.hours?.[weekdayName]?.closeTime || ''
                      ) : null}
                  </span>
                ) : (
                  <span>Closed Today</span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="py-8 border-b sticky top-0 bg-slate-50 z-10">
        <div className="max-w-screen-lg mx-auto relative px-4">
          <ul className="flex gap-2">
            {data.menus.map(m => (
              <li key={m.slug}>
                <Link
                  preventScrollReset={true}
                  prefetch="intent"
                  to={`/${m.slug}`}
                  className="underline"
                >{m.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-screen-lg mx-auto relative px-4">
        <div className="grid lg:grid-cols-12">
          <div className="col-span-7">
            <Outlet />
          </div>
          <div className="col-span-4 col-start-9 hidden lg:block">
            <div className="space-y-8 sticky top-28 pt-8">
              <div className="rounded-lg border bg-white shadow overflow-hidden">
                <div className="px-4 py-2 border-b">
                  <h2 className="font-semibold text-lg">Contact</h2>
                </div>
                <div className="p-4 text-sm">
                  <dl className="space-y-4">
                    {data?.phone?.length > 0 ? (
                      <div>
                        <dt className="font-medium mb-0.5 block">Phone</dt>
                        <dd>
                          <ul className="space-y-1">
                            {data?.phone?.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}
                    {data.address ? (
                      <div>
                        <dt className="font-medium mb-0.5 block">
                          Address
                        </dt>
                        <dd className="leading-normal">
                          {data.address?.streetAddress} <br />
                          {data.address?.city},{' '}
                          {data.address?.state}{' '}
                          {data.address?.zip}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
              <div className="rounded-lg border bg-white shadow overflow-hidden">
                <div className="px-4 py-2 border-b">
                  <h2 className="font-semibold text-lg">Hours</h2>
                </div>
                <div className="space-y-2.5 p-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <dl
                      key={day}
                      className="text-sm flex justify-between"
                    >
                      <div>
                        <dt className="font-medium">
                          {day}:
                        </dt>
                      </div>
                      <div>
                        {data.hours?.[day]?.isOpen ? (
                          <dd>
                            {data.hours?.[day]?.openTime &&
                              formatTime(
                                data.hours?.[day]?.openTime || ''
                              )}{' '}
                            -{' '}
                            {data.hours?.[day]?.closeTime &&
                              formatTime(
                                data.hours?.[day]?.closeTime || ''
                              )}
                          </dd>
                        ) : (
                          <dd>Closed</dd>
                        )}
                      </div>
                    </dl>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
