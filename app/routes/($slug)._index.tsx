import type { HeadersFunction, MetaFunction } from "@remix-run/node";
import { unstable_defineLoader as defineLoader } from '@remix-run/node'
import { useLoaderData } from "@remix-run/react";
import { prisma } from "#/utils/prisma.server";
import { BlurImage } from '#/components/blur-image';

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {

    const parentMeta = matches.flatMap(
        (match) => match.meta ?? []
    );
    return [
        ...parentMeta,
        { title: data?.data.title },
        { name: "description", content: data?.data.description }
    ];

};

export const headers: HeadersFunction = ({
    _actionHeaders,
    _errorHeaders,
    _loaderHeaders,
    _parentHeaders,
}) => ({
    "Cache-Control": "max-age=300, s-maxage=3600",
});

export const loader = defineLoader(async ({ request, params }) => {

    // const { hostname } = new URL(request.url)
    // const [tenant, domain, tld] = hostname.split(".")
    // console.log({ tenant, domain, tld })

    const data = await prisma.menus.findFirst({
        where: {
            slug: params.slug,
            restaurants: {
                // customHost: tenant
                customHost: "whereslloyd"
            }
        },
        include: {
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
                    }
                }
            },
        },
        orderBy: {
            position: 'asc'
        },
        omit: {
            restaurantId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
        },
    })

    if (!data) {
        throw new Response('Not Found', { status: 404 })
    }

    // console.log({ data })

    return { data }
})


export default function Index() {
    const { data } = useLoaderData<typeof loader>()

    return (
        <div className='pb-12 pt-8'>
            {data.sections.map(s => (
                <div key={s.id}>
                    <div className='mb-6'>
                        <h3 className='text-3xl font-semibold mb-1'>{s.title}</h3>
                        <p className='text-lg text-slate-600'>{s.description}</p>
                    </div>
                    <div className="space-y-4">
                        {s.menuItems.map(mi => (
                            <div key={mi.id} className="rounded-lg border bg-white shadow overflow-hidden">
                                {mi.image?.src ?
                                    <BlurImage
                                        blurDataUrl={mi.image.blurDataURL || undefined}
                                        className="aspect-[16/9] overflow-hidden"
                                        img={(
                                            <img
                                                loading="lazy"
                                                src={mi.image.src}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        )}
                                    /> : null}
                                {/* <pre>{JSON.stringify(mi, null, 2)}</pre> */}
                                <div className='p-4 flex'>
                                    <div className="grow">
                                        <p className='text-lg font-semibold mb-0.5'>{mi.title}</p>
                                        <p className='text-slate-500'>{mi.description}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">{mi.price?.toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'USD'
                                        })}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
