import { initCLayer, Sku, ShippingCategory } from '@commercelayer/js-sdk';
import { getIntegrationToken } from '@commercelayer/js-auth';

let token;
let initialized = false;

export const getToken = async (config) => {
  const { endpoint } = config;
  token = await getIntegrationToken(config);
  console.log('My  token: ', token);
  console.log('Expiration date: ', token.expires);
  const { accessToken } = token;

  if (!initialized) {
    initCLayer({ accessToken, endpoint });
    initialized = true;
  }
  return token;
};

/*
const handleErrors = (res) => {
  const errors = res.errors();
  if (!errors.empty()) {
    errors.toArray().map((e) => {
      const err = `${e.code} on ${e.field}: ${e.message}`;
      console.error(err);
      return err;
    });
  }
};
*/

export const isExpired = (aToken) => {
  const { created_at, expires_in } = aToken.data;
  const expire = created_at + expires_in;
  console.log('EXPIRE', expire, 'NOW', Date.now());
  return expire <= Date.now();
};

export const upsertSku = async (data) => {
  console.log('DATA', data);
  const { id, code, name, reference } = data;
  let sku = null;
  if (id) {
    sku = await Sku.find(id);
  } else if (code) {
    sku = await Sku.findBy({ code });
  }
  console.log('START', sku);
  try {
    if (sku) {
      console.log('UPDATE');
      sku = await sku.update({
        code,
        name,
        reference,
      });
      console.log('UPDATED SKU', sku);
    } else {
      // console.log('CREATE');
      const shippingCategory = await ShippingCategory.findBy({
        name: 'Merchandising',
      });
      const attributes = {
        code,
        name,
        reference,
        shippingCategory,
      };
      // console.log('attributes', attributes);
      sku = await Sku.create(attributes);
      console.log('CREATED SKU', sku);
    }
  } catch (error) {
    console.error('ERROR', error);
    throw error;
  }
  console.log('SKU', sku);
  return sku;
};

export const getLinks = (skuId = '') => ({
  sku: skuId ? `/admin/skus/${skuId}/edit` : `/admin/skus/`,
  inventory: `/admin/stock_items?p=&q[key]=stock_items&q[s]=sku_code+ASC&s=`,
  prices: `/admin/prices?p=&q[key]=prices&q[s]=sku_code+ASC&s=`,
});

/*
https://cantiere-creativo.commercelayer.io/admin/stock_items?utf8=%E2%9C%93&q%5Bkey%5D=stock_items&p=1&q%5Bstock_location_id_eq%5D=&q%5Bsku_code_or_sku_name_cont%5D=CIPPO-LIPPO-CALIPPO-XXXXX200
*/
