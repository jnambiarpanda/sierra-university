// Copyright Sierra

import { newIntegrationApi, makeFunction, fetch, useOutput } from "@sierra/agent";
import type { SierraOutfittersConfig } from "./types";

export default newIntegrationApi<SierraOutfittersConfig>()
    .withContexts({
        output: useOutput,
        // Provide any other runtime-scoped hooks your api might rely on, e.g. useMemory, useConversation, etc.
    })
    .registerFunctions({
        getOrderInfo: makeFunction({
            description:
                "Retrieve a single order, its items, and its shipments (if applicable) by order ID.",
            params: {
                orderId: {
                    type: "string",
                    description: "The order ID (e.g. ord_x1y2z3)",
                },
            },
            output: {
                type: "object",
                description: "Order details",
                properties: {
                    id: { type: "string", description: "Order ID" },
                    order_number: {
                        type: "string",
                        description: "Human-readable order number (e.g. SO-66272)",
                    },
                    customer_id: { type: "string", description: "Customer ID" },
                    status: {
                        type: "string",
                        description:
                            "Order status: pending, processing, shipped, delivered, cancelled, or returned",
                    },
                    subtotal: {
                        type: "number",
                        description: "Order subtotal before tax and shipping",
                    },
                    tax: { type: "number", description: "Tax amount" },
                    shipping_cost: { type: "number", description: "Shipping cost" },
                    discount: { type: "number", description: "Discount amount" },
                    total: { type: "number", description: "Total order amount" },
                    created_at: {
                        type: "string",
                        description: "ISO 8601 timestamp when the order was created",
                    },
                    updated_at: {
                        type: "string",
                        description: "ISO 8601 timestamp of last update",
                    },
                    items: {
                        type: "array",
                        description: "Order line items",
                        items: {
                            type: "object",
                            description: "An order line item",
                            properties: {
                                id: { type: "string", description: "Order item ID" },
                                product_id: { type: "string", description: "Product ID" },
                                product_name: { type: "string", description: "Product name" },
                                variant_id: { type: "string", description: "Variant ID" },
                                variant_name: { type: "string", description: "Variant name" },
                                quantity: { type: "number", description: "Quantity ordered" },
                                unit_price: { type: "number", description: "Price per unit" },
                                total_price: {
                                    type: "number",
                                    description: "Total price for this line item",
                                },
                            },
                        },
                    },
                    shipping_address: {
                        type: "object",
                        description: "Shipping address",
                        properties: {
                            id: { type: "string", description: "Address ID" },
                            line1: { type: "string", description: "Street address" },
                            city: { type: "string", description: "City" },
                            state: { type: "string", description: "State" },
                            zip: { type: "string", description: "ZIP code" },
                            country: { type: "string", description: "Country code" },
                            type: { type: "string", description: "Address type" },
                            is_default: {
                                type: "boolean",
                                description: "Whether this is the default address",
                            },
                        },
                    },
                    billing_address: {
                        type: "object",
                        description: "Billing address",
                        properties: {
                            id: { type: "string", description: "Address ID" },
                            line1: { type: "string", description: "Street address" },
                            city: { type: "string", description: "City" },
                            state: { type: "string", description: "State" },
                            zip: { type: "string", description: "ZIP code" },
                            country: { type: "string", description: "Country code" },
                            type: { type: "string", description: "Address type" },
                            is_default: {
                                type: "boolean",
                                description: "Whether this is the default address",
                            },
                        },
                    },
                    shipments: {
                        type: "array",
                        description:
                            "Shipment details, included when order status is shipped, delivered, or returned",
                        items: {
                            type: "object",
                            description: "A shipment",
                            properties: {
                                id: { type: "string", description: "Shipment ID" },
                                carrier: {
                                    type: "string",
                                    description: "Shipping carrier (e.g. FedEx, UPS)",
                                },
                                tracking_number: {
                                    type: "string",
                                    description: "Carrier tracking number",
                                },
                                status: {
                                    type: "string",
                                    description:
                                        "Shipment status: label_created, picked_up, in_transit, out_for_delivery, delivered, or exception",
                                },
                                estimated_delivery: {
                                    type: "string",
                                    description: "ISO 8601 estimated delivery timestamp",
                                },
                                shipped_at: {
                                    type: "string",
                                    description: "ISO 8601 timestamp when the shipment was shipped",
                                },
                            },
                        },
                    },
                },
            },
            func: (ctx, params) => {
                const { data } = fetch.jsonSync<{
                    success: boolean;
                    data: {
                        id: string;
                        order_number: string;
                        customer_id: string;
                        status: string;
                        subtotal: number;
                        tax: number;
                        shipping_cost: number;
                        discount: number;
                        total: number;
                        created_at: string;
                        updated_at: string;
                        items: {
                            id: string;
                            product_id: string;
                            product_name: string;
                            variant_id: string;
                            variant_name: string;
                            quantity: number;
                            unit_price: number;
                            total_price: number;
                        }[];
                        shipping_address: {
                            id: string;
                            line1: string;
                            city: string;
                            state: string;
                            zip: string;
                            country: string;
                            type: string;
                            is_default: boolean;
                        };
                        billing_address: {
                            id: string;
                            line1: string;
                            city: string;
                            state: string;
                            zip: string;
                            country: string;
                            type: string;
                            is_default: boolean;
                        };
                    };
                }>(`https://gosierra.biz/api/v1/orders/${params.orderId}`, {
                    method: "GET",
                    headers: { "X-API-Key": ctx.settings.apiKey },
                }).body!;

                const order = {
                    id: data.id,
                    order_number: data.order_number,
                    customer_id: data.customer_id,
                    status: data.status,
                    subtotal: data.subtotal,
                    tax: data.tax,
                    shipping_cost: data.shipping_cost,
                    discount: data.discount,
                    total: data.total,
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                    items: data.items.map(item => ({
                        id: item.id,
                        product_id: item.product_id,
                        product_name: item.product_name,
                        variant_id: item.variant_id,
                        variant_name: item.variant_name,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                    })),
                    shipping_address: {
                        id: data.shipping_address.id,
                        line1: data.shipping_address.line1,
                        city: data.shipping_address.city,
                        state: data.shipping_address.state,
                        zip: data.shipping_address.zip,
                        country: data.shipping_address.country,
                        type: data.shipping_address.type,
                        is_default: data.shipping_address.is_default,
                    },
                    billing_address: {
                        id: data.billing_address.id,
                        line1: data.billing_address.line1,
                        city: data.billing_address.city,
                        state: data.billing_address.state,
                        zip: data.billing_address.zip,
                        country: data.billing_address.country,
                        type: data.billing_address.type,
                        is_default: data.billing_address.is_default,
                    },
                    shipments: [] as {
                        id: string;
                        carrier: string;
                        tracking_number: string;
                        status: string;
                        estimated_delivery: string;
                        shipped_at: string;
                    }[],
                };

                if (["shipped", "delivered", "returned"].includes(data.status)) {
                    const { data: shipments } = fetch.jsonSync<{
                        success: boolean;
                        data: {
                            id: string;
                            carrier: string;
                            tracking_number: string;
                            status: string;
                            estimated_delivery: string;
                            shipped_at: string;
                        }[];
                    }>(`https://gosierra.biz/api/v1/orders/${params.orderId}/shipments`, {
                        method: "GET",
                        headers: { "X-API-Key": ctx.settings.apiKey },
                    }).body!;

                    order.shipments = shipments.map(s => ({
                        id: s.id,
                        carrier: s.carrier,
                        tracking_number: s.tracking_number,
                        status: s.status,
                        estimated_delivery: s.estimated_delivery,
                        shipped_at: s.shipped_at,
                    }));
                }

                return order;
            },
        }),
        cancelOrder: makeFunction({
            description:
                "Cancel an order. Only orders in pending or processing status can be cancelled.",
            params: {
                orderId: {
                    type: "string",
                    description: "The order ID to cancel (e.g. ord_x1y2z3)",
                },
            },
            output: {
                type: "object",
                description: "Cancellation result",
                properties: {
                    order_number: {
                        type: "string",
                        description: "The order number (e.g. SO-81362)",
                    },
                    cancelled: {
                        type: "boolean",
                        description: "Whether the cancellation was successful",
                    },
                    reason: {
                        type: "string",
                        description: "Error reason if cancellation failed, empty on success",
                    },
                },
            },
            func: (ctx, params) => {
                const response = fetch.jsonSync<{
                    success: boolean;
                    data?: { order_number: string };
                    error?: { code: string; message: string };
                }>(`https://gosierra.biz/api/v1/orders/${params.orderId}/cancel`, {
                    method: "PATCH",
                    headers: { "X-API-Key": ctx.settings.apiKey },
                });

                const body = response.body!;
                if (response.status === 200 && body.success) {
                    return {
                        order_number: body.data!.order_number,
                        cancelled: true,
                        reason: "",
                    };
                }
                return {
                    order_number: "",
                    cancelled: false,
                    reason: body.error ? body.error.message : "Order could not be cancelled",
                };
            },
        }),
        getOrderShipments: makeFunction({
            description:
                "Deprecated: use getOrderInfo instead, which includes shipments automatically. List all shipments for an order.",
            params: {
                orderId: {
                    type: "string",
                    description: "The order ID (e.g. ord_x1y2z3)",
                },
            },
            output: {
                type: "array",
                description: "List of shipments for the order",
                items: {
                    type: "object",
                    description: "A shipment",
                    properties: {
                        id: { type: "string", description: "Shipment ID" },
                        order_id: { type: "string", description: "Associated order ID" },
                        carrier: {
                            type: "string",
                            description: "Shipping carrier (e.g. FedEx, UPS)",
                        },
                        tracking_number: { type: "string", description: "Carrier tracking number" },
                        status: {
                            type: "string",
                            description:
                                "Shipment status: label_created, picked_up, in_transit, out_for_delivery, delivered, or exception",
                        },
                        estimated_delivery: {
                            type: "string",
                            description: "ISO 8601 estimated delivery timestamp",
                        },
                        shipped_at: {
                            type: "string",
                            description: "ISO 8601 timestamp when the shipment was shipped",
                        },
                    },
                },
            },
            func: (ctx, params) => {
                const { data } = fetch.jsonSync<{
                    success: boolean;
                    data: {
                        id: string;
                        order_id: string;
                        carrier: string;
                        tracking_number: string;
                        status: string;
                        estimated_delivery: string;
                        shipped_at: string;
                    }[];
                }>(`https://gosierra.biz/api/v1/orders/${params.orderId}/shipments`, {
                    method: "GET",
                    headers: { "X-API-Key": ctx.settings.apiKey },
                }).body!;

                return data.map(shipment => ({
                    id: shipment.id,
                    order_id: shipment.order_id,
                    carrier: shipment.carrier,
                    tracking_number: shipment.tracking_number,
                    status: shipment.status,
                    estimated_delivery: shipment.estimated_delivery,
                    shipped_at: shipment.shipped_at,
                }));
            },
        }),
        getShipmentTracking: makeFunction({
            description: "Get detailed tracking information and event history for a shipment",
            params: {
                shipmentId: {
                    type: "string",
                    description: "The shipment ID (e.g. ship_abc123)",
                },
            },
            output: {
                type: "object",
                description: "Tracking details for a shipment",
                properties: {
                    shipment_id: { type: "string", description: "Shipment ID" },
                    carrier: {
                        type: "string",
                        description: "Shipping carrier (e.g. UPS Ground)",
                    },
                    tracking_number: { type: "string", description: "Carrier tracking number" },
                    status: {
                        type: "string",
                        description:
                            "Shipment status: label_created, picked_up, in_transit, out_for_delivery, delivered, or exception",
                    },
                    estimated_delivery: {
                        type: "string",
                        description: "ISO 8601 estimated delivery timestamp",
                    },
                    events: {
                        type: "array",
                        description: "Tracking event history",
                        items: {
                            type: "object",
                            description: "A tracking event",
                            properties: {
                                timestamp: {
                                    type: "string",
                                    description: "ISO 8601 event timestamp",
                                },
                                status: { type: "string", description: "Event status" },
                                location: {
                                    type: "string",
                                    description: "Location where the event occurred",
                                },
                                description: {
                                    type: "string",
                                    description: "Human-readable event description",
                                },
                            },
                        },
                    },
                },
            },
            func: (ctx, params) => {
                const { data } = fetch.jsonSync<{
                    success: boolean;
                    data: {
                        shipment_id: string;
                        carrier: string;
                        tracking_number: string;
                        status: string;
                        estimated_delivery: string;
                        events: {
                            timestamp: string;
                            status: string;
                            location: string;
                            description: string;
                        }[];
                    };
                }>(`https://gosierra.biz/api/v1/shipments/${params.shipmentId}/tracking`, {
                    method: "GET",
                    headers: { "X-API-Key": ctx.settings.apiKey },
                }).body!;

                return {
                    shipment_id: data.shipment_id,
                    carrier: data.carrier,
                    tracking_number: data.tracking_number,
                    status: data.status,
                    estimated_delivery: data.estimated_delivery,
                    events: data.events.map(event => ({
                        timestamp: event.timestamp,
                        status: event.status,
                        location: event.location,
                        description: event.description,
                    })),
                };
            },
        }),
        createCoupon: makeFunction({
            description:
                "Create a courtesy coupon for a customer. Useful for service recovery such as apologies for delayed shipments or order issues.",
            params: {
                customerId: {
                    type: "string",
                    description: "The customer ID (e.g. cust_a1b2c3d4)",
                },
                reason: {
                    type: "string",
                    description:
                        "Reason for issuing the coupon (e.g. Apology for delayed shipment)",
                },
            },
            output: {
                type: "object",
                description: "Coupon creation result",
                additionalProperties: "any",
                // Step 3: Replace this with a properties object that describes the data
                // you're returning. (See above for an example)
            },
            func: (ctx, params) => {
                type RawDataResponse = {
                    success: boolean;
                    data: {
                        id: string;
                        customer_id: string;
                        code: string;
                        reason: string;
                        discount_type: string;
                        discount_value: number;
                        max_uses: number;
                        current_uses: number;
                        expires_at: string;
                        created_at: string;
                    };
                };

                // Step 2: Make this a network call
                const fakeResponse: RawDataResponse = {
                    success: true,
                    data: {
                        id: "123",
                        customer_id: params.customerId,
                        code: "GROVE577",
                        reason: params.reason,
                        discount_type: "percentage",
                        discount_value: 15,
                        max_uses: 1,
                        current_uses: 0,
                        expires_at: "2027-01-01",
                        created_at: "2026-01-01",
                    },
                };
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const couponData = fakeResponse.data;

                // Step 1: Simplify this data object. Maybe we don't need to return everything.

                return fakeResponse;
            },
        }),
        getCustomerInfo: makeFunction({
            description: "Retrieve customer profile information by customer ID.",
            params: {
                customerId: {
                    type: "string",
                    description: "The customer ID (e.g. cust_a1b2c3d4)",
                },
            },
            output: {
                type: "object",
                description: "Customer details",
                properties: {
                    id: { type: "string", description: "Customer ID" },
                    email: { type: "string", description: "Customer email address" },
                    first_name: { type: "string", description: "Customer first name" },
                    last_name: { type: "string", description: "Customer last name" },
                    phone: { type: "string", description: "Customer phone number" },
                    addresses: {
                        type: "array",
                        description: "Customer addresses",
                        items: {
                            type: "object",
                            description: "An address",
                            properties: {
                                id: { type: "string", description: "Address ID" },
                                type: {
                                    type: "string",
                                    description: "Address type: shipping or billing",
                                },
                                line1: { type: "string", description: "Street address" },
                                city: { type: "string", description: "City" },
                                state: { type: "string", description: "State" },
                                zip: { type: "string", description: "ZIP code" },
                                country: { type: "string", description: "Country code" },
                                is_default: {
                                    type: "boolean",
                                    description: "Whether this is the default address",
                                },
                            },
                        },
                    },
                    created_at: {
                        type: "string",
                        description: "ISO 8601 timestamp when the customer was created",
                    },
                    updated_at: {
                        type: "string",
                        description: "ISO 8601 timestamp of last update",
                    },
                },
            },
            func: (ctx, params) => {
                const { data } = fetch.jsonSync<{
                    success: boolean;
                    data: {
                        id: string;
                        email: string;
                        first_name: string;
                        last_name: string;
                        phone: string;
                        addresses: {
                            id: string;
                            type: string;
                            line1: string;
                            city: string;
                            state: string;
                            zip: string;
                            country: string;
                            is_default: boolean;
                        }[];
                        created_at: string;
                        updated_at: string;
                    };
                }>(`https://gosierra.biz/api/v1/customers/${params.customerId}`, {
                    method: "GET",
                    headers: { "X-API-Key": ctx.settings.apiKey },
                }).body!;

                return {
                    id: data.id,
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    phone: data.phone,
                    addresses: data.addresses.map(addr => ({
                        id: addr.id,
                        type: addr.type,
                        line1: addr.line1,
                        city: addr.city,
                        state: addr.state,
                        zip: addr.zip,
                        country: addr.country,
                        is_default: addr.is_default,
                    })),
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                };
            },
        }),
    });
