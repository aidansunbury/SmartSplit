import { Banknote, CreditCard } from "lucide-react";
import type { paymentMethods } from "~/server/db/schema";
const ZelleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-full w-full"
    viewBox="0 0 48 48"
  >
    <title>ZelleIcon</title>
    <path
      fill="#a0f"
      d="M35,42H13c-3.866,0-7-3.134-7-7V13c0-3.866,3.134-7,7-7h22c3.866,0,7,3.134,7,7v22 C42,38.866,38.866,42,35,42z"
    />
    <path
      fill="#fff"
      d="M17.5,18.5h14c0.552,0,1-0.448,1-1V15c0-0.552-0.448-1-1-1h-14c-0.552,0-1,0.448-1,1v2.5	C16.5,18.052,16.948,18.5,17.5,18.5z"
    />
    <path
      fill="#fff"
      d="M17,34.5h14.5c0.552,0,1-0.448,1-1V31c0-0.552-0.448-1-1-1H17c-0.552,0-1,0.448-1,1v2.5	C16,34.052,16.448,34.5,17,34.5z"
    />
    <path
      fill="#fff"
      d="M22.25,11v6c0,0.276,0.224,0.5,0.5,0.5h3.5c0.276,0,0.5-0.224,0.5-0.5v-6c0-0.276-0.224-0.5-0.5-0.5	h-3.5C22.474,10.5,22.25,10.724,22.25,11z"
    />
    <path
      fill="#fff"
      d="M22.25,32v6c0,0.276,0.224,0.5,0.5,0.5h3.5c0.276,0,0.5-0.224,0.5-0.5v-6c0-0.276-0.224-0.5-0.5-0.5	h-3.5C22.474,31.5,22.25,31.724,22.25,32z"
    />
    <path
      fill="#fff"
      d="M16.578,30.938H22l10.294-12.839c0.178-0.222,0.019-0.552-0.266-0.552H26.5L16.275,30.298	C16.065,30.553,16.247,30.938,16.578,30.938z"
    />
  </svg>
);
const PayPalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-full w-full"
    viewBox="0 0 48 48"
  >
    <title>PayPalIcon</title>
    <path
      fill="#0d62ab"
      d="M18.7,13.767l0.005,0.002C18.809,13.326,19.187,13,19.66,13h13.472c0.017,0,0.034-0.007,0.051-0.006	C32.896,8.215,28.887,6,25.35,6H11.878c-0.474,0-0.852,0.335-0.955,0.777l-0.005-0.002L5.029,33.813l0.013,0.001	c-0.014,0.064-0.039,0.125-0.039,0.194c0,0.553,0.447,0.991,1,0.991h8.071L18.7,13.767z"
    />
    <path
      fill="#199be2"
      d="M33.183,12.994c0.053,0.876-0.005,1.829-0.229,2.882c-1.281,5.995-5.912,9.115-11.635,9.115	c0,0-3.47,0-4.313,0c-0.521,0-0.767,0.306-0.88,0.54l-1.74,8.049l-0.305,1.429h-0.006l-1.263,5.796l0.013,0.001	c-0.014,0.064-0.039,0.125-0.039,0.194c0,0.553,0.447,1,1,1h7.333l0.013-0.01c0.472-0.007,0.847-0.344,0.945-0.788l0.018-0.015	l1.812-8.416c0,0,0.126-0.803,0.97-0.803s4.178,0,4.178,0c5.723,0,10.401-3.106,11.683-9.102	C42.18,16.106,37.358,13.019,33.183,12.994z"
    />
    <path
      fill="#006fc4"
      d="M19.66,13c-0.474,0-0.852,0.326-0.955,0.769L18.7,13.767l-2.575,11.765	c0.113-0.234,0.359-0.54,0.88-0.54c0.844,0,4.235,0,4.235,0c5.723,0,10.432-3.12,11.713-9.115c0.225-1.053,0.282-2.006,0.229-2.882	C33.166,12.993,33.148,13,33.132,13H19.66z"
    />
  </svg>
);

const CashAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-full w-full"
    viewBox="0 0 50 50"
  >
    <title>CashAppIcon</title>
    <path
      fill="#64dd17"
      d="M14,6h20c4.418,0,8,3.582,8,8v20c0,4.418-3.582,8-8,8H14c-4.418,0-8-3.582-8-8V14	C6,9.582,9.582,6,14,6z"
    />
    <path
      fill="#fafafa"
      d="M23.056,33.933c-0.122,0-0.245-0.001-0.37-0.004c-3.612-0.088-5.98-2.312-6.781-3.198 c-0.177-0.195-0.171-0.489,0.011-0.68l1.664-1.876c0.178-0.187,0.464-0.209,0.667-0.05c0.738,0.58,2.446,2.054,4.696,2.177 c2.612,0.142,3.829-0.601,3.986-1.736c0.149-1.075-0.375-1.986-3.277-2.739c-5.185-1.345-6.115-4.37-5.796-6.897 c0.335-2.659,3.09-4.777,6.285-4.745c4.566,0.047,7.38,2.086,8.361,2.938c0.22,0.191,0.225,0.525,0.018,0.73l-1.581,1.786 c-0.165,0.164-0.422,0.195-0.617,0.068c-0.799-0.52-2.392-2.074-5.236-2.074c-1.75,0-2.816,0.668-2.927,1.541 c-0.154,1.22,0.661,2.274,3.155,2.837c5.527,1.247,6.457,4.467,5.87,7.068C30.644,31.474,27.907,33.933,23.056,33.933z"
    />
    <path
      fill="#fafafa"
      d="M28.032,16.592l0.839-3.99C28.937,12.292,28.699,12,28.382,12h-3.065 c-0.236,0-0.441,0.166-0.489,0.397l-0.843,4.011L28.032,16.592z"
    />
    <path
      fill="#fafafa"
      d="M20.916,31l-0.925,4.397C19.926,35.708,20.163,36,20.481,36h3.065c0.236,0,0.441-0.166,0.489-0.397 L25.003,31H20.916z"
    />
  </svg>
);

const VenmoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    className="h-full w-full"
    viewBox="0 0 50 50"
  >
    <title>VenmoIcon</title>
    <path
      fill="#008CFF"
      d="M41,4H9C6.243,4,4,6.243,4,9v32c0,2.757,2.243,5,5,5h32c2.757,0,5-2.243,5-5V9C46,6.243,43.757,4,41,4z M28,37H17l-3-22 l8-1.001L24,30c1.833-2.918,4-7.873,4-11c0-1.711-0.531-3.04-1-4l8-2c0.853,1.377,1,3.795,1,5.586C36,24.3,32.05,31.788,28,37z"
    />
  </svg>
);
type PaymentMethod = (typeof paymentMethods.enumValues)[number];

export const PaymentMethodIconMap = new Map<PaymentMethod, React.ReactNode>([
  ["PayPal", <PayPalIcon />],
  ["Zelle", <ZelleIcon />],
  ["Cash App", <CashAppIcon />],
  ["Venmo", <VenmoIcon />],
  ["Cash", <Banknote />],
  ["Other", <CreditCard />],
]);

export { ZelleIcon, PayPalIcon, CashAppIcon, VenmoIcon };