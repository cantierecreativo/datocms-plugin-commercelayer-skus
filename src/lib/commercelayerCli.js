import { initCLayer, Sku, ShippingCategory } from "@commercelayer/js-sdk";
import { getIntegrationToken } from "@commercelayer/js-auth";

let token;
let initialized = false;

export const getToken = async ({ clientId, clientSecret, endpoint }) => {
  token = await getIntegrationToken({
    clientId,
    clientSecret,
    endpoint,
  });
  // console.log("My access token: ", token.accessToken);
  // console.log("Expiration date: ", token.expires);
  const { accessToken } = token;
  if (!initialized) {
    initCLayer({ accessToken, endpoint });
    initialized = true;
  }
  return token;
};

// const handleErrors = (res) => {
//   const errors = res.errors();
//   if (!errors.empty()) {
//     errors.toArray().map((e) => {
//       const err = `${e.code} on ${e.field}: ${e.message}`;
//       console.error(err);
//       return err;
//     });
//   }
// };

export const upsertSku = async (data) => {
  const { sku: code, title: name, reference } = data;
  let sku = await Sku.findBy({ code });
  try {
    if (sku) {
      console.log("found sku, UPDATE", sku);
      sku = await sku.update({
        code,
        name,
        reference,
      });
    } else {
      console.log("sku not found CREATE");

      const shippingCategory = await ShippingCategory.findBy({
        name: "Merchandising",
      });
      const attributes = {
        code,
        name,
        reference,
        shippingCategory,
      };
      console.log("attributes", attributes);
      sku = await Sku.create(attributes);
    }
  } catch (error) {
    console.error(error);
  }
  return sku;
};
