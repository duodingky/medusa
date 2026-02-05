import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useState } from "react";

const CheckoutPage = () => {
  const [useShippingForBilling, setUseShippingForBilling] = useState(true);
  const billingDisabled = useShippingForBilling;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Checkout</Heading>
      </div>
      <div className="px-6 py-6">
        <form className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-6">
              <section className="rounded-lg border border-ui-border-base p-4">
                <Heading level="h2">FF</Heading>
                <div className="mt-4 grid gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">Full name</span>
                    <input
                      className="rounded-md border border-ui-border-base px-3 py-2"
                      placeholder="Jane Doe"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">Email</span>
                    <input
                      className="rounded-md border border-ui-border-base px-3 py-2"
                      type="email"
                      placeholder="jane@example.com"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">Phone</span>
                    <input
                      className="rounded-md border border-ui-border-base px-3 py-2"
                      type="tel"
                      placeholder="+1 555 000 0000"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">Order notes</span>
                    <textarea
                      className="min-h-[96px] rounded-md border border-ui-border-base px-3 py-2"
                      placeholder="Leave at the front desk."
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-lg border border-ui-border-base p-4">
                <Heading level="h2">Shipping address</Heading>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-ui-fg-subtle">Address line 1</span>
                    <input className="rounded-md border border-ui-border-base px-3 py-2" />
                  </label>
                  <label className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-ui-fg-subtle">Address line 2</span>
                    <input className="rounded-md border border-ui-border-base px-3 py-2" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">City</span>
                    <input className="rounded-md border border-ui-border-base px-3 py-2" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">State / Province</span>
                    <input className="rounded-md border border-ui-border-base px-3 py-2" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">Postal code</span>
                    <input className="rounded-md border border-ui-border-base px-3 py-2" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">Country</span>
                    <select className="rounded-md border border-ui-border-base px-3 py-2">
                      <option value="">Select country</option>
                      <option value="us">United States</option>
                      <option value="ca">Canada</option>
                      <option value="gb">United Kingdom</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-lg border border-ui-border-base p-4">
                <Heading level="h2">Shipping method</Heading>
                <div className="mt-4 grid gap-3">
                  <label className="flex items-start gap-3 rounded-md border border-ui-border-base p-3">
                    <input type="radio" name="shipping_method" defaultChecked />
                    <div>
                      <p className="font-medium">Standard shipping</p>
                      <p className="text-ui-fg-subtle">3-5 business days</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-md border border-ui-border-base p-3">
                    <input type="radio" name="shipping_method" />
                    <div>
                      <p className="font-medium">Express shipping</p>
                      <p className="text-ui-fg-subtle">1-2 business days</p>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            <div className="grid gap-6">
              <section className="rounded-lg border border-ui-border-base p-4">
                <Heading level="h2">Billing address</Heading>
                <div className="mt-4 grid gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useShippingForBilling}
                      onChange={(event) =>
                        setUseShippingForBilling(event.target.checked)
                      }
                    />
                    <span className="text-ui-fg-subtle">
                      Same as shipping address
                    </span>
                  </label>
                  {billingDisabled && (
                    <p className="text-ui-fg-subtle">
                      Billing address will use the shipping details.
                    </p>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-ui-fg-subtle">Address line 1</span>
                      <input
                        className="rounded-md border border-ui-border-base px-3 py-2"
                        disabled={billingDisabled}
                      />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-ui-fg-subtle">Address line 2</span>
                      <input
                        className="rounded-md border border-ui-border-base px-3 py-2"
                        disabled={billingDisabled}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-ui-fg-subtle">City</span>
                      <input
                        className="rounded-md border border-ui-border-base px-3 py-2"
                        disabled={billingDisabled}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-ui-fg-subtle">State / Province</span>
                      <input
                        className="rounded-md border border-ui-border-base px-3 py-2"
                        disabled={billingDisabled}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-ui-fg-subtle">Postal code</span>
                      <input
                        className="rounded-md border border-ui-border-base px-3 py-2"
                        disabled={billingDisabled}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-ui-fg-subtle">Country</span>
                      <select
                        className="rounded-md border border-ui-border-base px-3 py-2"
                        disabled={billingDisabled}
                      >
                        <option value="">Select country</option>
                        <option value="us">United States</option>
                        <option value="ca">Canada</option>
                        <option value="gb">United Kingdom</option>
                      </select>
                    </label>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-ui-border-base p-4">
                <Heading level="h2">Payment</Heading>
                <div className="mt-4 grid gap-4">
                  <label className="flex items-start gap-3 rounded-md border border-ui-border-base p-3">
                    <input type="radio" name="payment_method" defaultChecked />
                    <div>
                      <p className="font-medium">Manual Payment</p>
                      <p className="text-ui-fg-subtle">
                        Collect payment offline and confirm manually.
                      </p>
                    </div>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-ui-fg-subtle">Payment reference</span>
                    <input
                      className="rounded-md border border-ui-border-base px-3 py-2"
                      placeholder="Manual payment reference"
                    />
                  </label>
                </div>
              </section>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-ui-bg-interactive px-4 py-2 text-ui-fg-on-color"
              type="button"
            >
              Place order
            </button>
            <button
              className="rounded-md border border-ui-border-base px-4 py-2"
              type="button"
            >
              Save draft
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Checkout",
  icon: Buildings,
});

export default CheckoutPage;
