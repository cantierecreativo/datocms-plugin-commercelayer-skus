import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import connectToDatoCms from "./connectToDatoCms";
import { getToken, upsertSku } from "./lib/commercelayerCli";
import "./style.sass";

function Main({ plugin, fieldValue }) {
  // const { prefix } = plugin.parameters.instance;
  const { clientId, clientSecret, endpoint } = plugin.parameters.global;
  const config = {
    clientId,
    clientSecret,
    endpoint,
  };

  // const askToken = async () => {
  //   const tokenObj = await getToken(config);
  //   setToken(tokenObj.accessToken);
  // };
  // const doTest = async () => {
  //   const data = await test();
  //   console.log("data", data);
  // };

  const schema = yup.object().shape({
    sku: yup.string().required("SKU is rwequired"),
    title: yup.string().required("Title is required"),
  });

  if (plugin.itemStatus === "new") {
    return <div>Save the record a first time.</div>;
  }
  const obj = fieldValue ? JSON.parse(fieldValue) : null;
  const defaultValues = {
    title: obj?.title,
    sku: obj?.sku,
  };
  const { register, handleSubmit, errors } = useForm({
    validationSchema: schema,
    defaultValues,
  });

  const saveToCommerceLayer = async (data) => {
    await getToken(config);
    const payload = { ...data, reference: plugin.itemId, cl: obj?.clId };
    console.log("payload", payload);
    const skuData = await upsertSku(payload);
    console.log("skuData", skuData);
    if (skuData) {
      plugin.setFieldValue(
        plugin.fieldPath,
        JSON.stringify({ ...payload, clId: skuData.id })
      );
    }
  };

  const onSubmit = (data) => {
    console.log(data);
    saveToCommerceLayer(data);
  };

  return (
    <div className="container">
      <p>{`FIELD VALUE = ${fieldValue}`}</p>
      <p>{`RECORD ID = ${plugin.itemId}`}</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="label">SKU</div>
        <input
          name="sku"
          type="text"
          ref={register({ required: true, minLength: 5, maxLength: 30 })}
        />
        {errors.sku && (
          <span>This field is required, and should be from 5 to 30 chars</span>
        )}
        <div className="label">Title</div>
        <input name="title" type="text" ref={register({ required: true })} />
        {errors.title && (
          <span>This field is required, and must be unique</span>
        )}
        <div>
          <button type="submit">Save to CommerceLayer</button>
        </div>
      </form>
    </div>
  );
}
const Wrap = connectToDatoCms((plugin) => {
  return {
    fieldValue: plugin.getFieldValue(plugin.fieldPath),
  };
})(Main);

export default Wrap;
