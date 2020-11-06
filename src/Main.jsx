import React, { useState, Fragment } from "react";
import { useForm } from "react-hook-form";
// import { EvalSourceMapDevToolPlugin } from "webpack";
import * as yup from "yup";
import connectToDatoCms from "./connectToDatoCms";
import { getToken, upsertSku, getLinks, isExpired } from "./lib/cl";
import "./style.sass";

function Main({ plugin, fieldValue }) {
  // const { prefix } = plugin.parameters.instance;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  const { clientId, clientSecret, endpoint } = plugin.parameters.global;
  const config = { clientId, clientSecret, endpoint };

  const schema = yup.object().shape({
    id: yup.string(),
    reference: yup.string(),
    code: yup.string().required("SKU Code is required!"),
    name: yup.string().required("Product Name is required!"),
  });

  if (plugin.itemStatus === "new") {
    return <div>Save the record a first time.</div>;
  }
  const savedData = fieldValue ? JSON.parse(fieldValue) : null;
  const defaultValues = {
    name: savedData?.name,
    code: savedData?.code,
    id: savedData?.id,
    reference:
      savedData && savedData.reference ? savedData.reference : plugin.itemId,
  };
  const links = getLinks(savedData?.code);
  const { register, handleSubmit, errors, reset } = useForm({
    validationSchema: schema,
    defaultValues,
  });

  const saveToCommerceLayer = async (data) => {
    setLoading(true);

    try {
      if (!token || isExpired(token)) {
        const t = await getToken(config);
        setToken(t);
      }
      const payload = { ...data };
      const skuData = await upsertSku(payload);
      console.log("skuData", skuData);
      if (skuData) {
        const { name, code, id } = skuData;
        reset(skuData);
        plugin.setFieldValue(
          plugin.fieldPath,
          JSON.stringify({ ...payload, name, code, id })
        );
      } else {
        setError("OPS something gone wrong.");
        reset(skuData);
      }
    } catch (err) {
      console.error(err);
      setError(JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data) => {
    console.log(data);
    saveToCommerceLayer(data);
  };

  return (
    <div className="container">
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading...</div>}
      {!loading && (
        <Fragment>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="label">CL ID</div>
            <input name="id" type="text" disabled ref={register()} />

            <div className="label">DATO ID</div>
            <input name="reference" type="text" disabled ref={register()} />

            <div className="label">SKU Code</div>
            <input
              name="code"
              type="text"
              ref={register({ required: true, minLength: 5, maxLength: 30 })}
            />
            {errors.code && (
              <span>
                This field is required, and should be from 5 to 30 chars
              </span>
            )}

            <div className="label">Product Name</div>
            <input name="name" type="text" ref={register({ required: true })} />
            {errors.name && (
              <span>This field is required, and must be unique</span>
            )}

            <div>
              <button type="submit">Save to CommerceLayer</button>
            </div>
          </form>
        </Fragment>
      )}

      <div style={{ marginTop: 20, backgroundColor: "#efefef" }}>
        {Object.keys(links).map((k) => {
          return (
            <p key={k}>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${endpoint}${links[k]}`}
              >
                {k}
              </a>
            </p>
          );
        })}
      </div>

      <div style={{ marginTop: 20, backgroundColor: "#efefef" }}>
        <pre>
          <small>{`${JSON.stringify(savedData, null, 2)}`}</small>
        </pre>
        <p>{`RECORD ID = ${plugin.itemId}`}</p>
      </div>
    </div>
  );
}
const Wrap = connectToDatoCms((plugin) => {
  return {
    fieldValue: plugin.getFieldValue(plugin.fieldPath),
  };
})(Main);

export default Wrap;
