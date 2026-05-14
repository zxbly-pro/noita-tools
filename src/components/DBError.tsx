import { useState } from "react";
import { Button } from "react-bootstrap";

import "./App.css";

import classNames from "classnames";
import SyncHandler from "./Settings/SyncHandler";

const DBError = props => {
  const [uuid, setUUID] = useState("(available after upload)");
  const [uploaded, setUploaded] = useState(false);
  const [syncHandler] = useState(() => new SyncHandler());
  const handleUpload = async () => {
    const id = await syncHandler.sendToDebug();
    setUUID(id);
    setUploaded(true);
  };
  return (
    <div className="position-absolute top-50 start-50 translate-middle fs-4 fw-light">
      <p>
        加载数据库时出错： <br />
        <code>错误： {props.error.message}</code>
      </p>
      <p>
        <b>这可能由以下原因导致：</b>
        <ul>
          <li>
            常见问题是在<b>隐私模式</b>下使用 Noitool。
          </li>
          <li>某些浏览器的安全配置不允许访问 indexeddb。</li>
          <li>
            极少数情况下，您的浏览器可能不支持 indexeddb。查看{" "}
            <a href="https://caniuse.com/indexeddb" target="_blank" rel="noreferrer">
              此页面
            </a>{" "}
            了解哪些浏览器支持它。
          </li>
        </ul>
      </p>
      <p>
        如果您确定这是 Noitool 的问题，您可以帮助解决！请点击下方按钮上传您的 Noitool 数据库以协助调试，并在{" "}
        <a target="_blank" rel="noreferrer" href="https://github.com/TwoAbove/noita-tools/issues/">
          这里
        </a>
        提交 bug 报告。请附上代码 [<code>{uuid}</code>]。 <br />
        <Button
          variant={uploaded ? "success" : "primary"}
          className={classNames([uploaded && "success", "mt-3"])}
          onClick={handleUpload}
        >
          {uploaded ? "已上传" : "上传"}
        </Button>
      </p>
      <p>如果您确定此消息是错误的，请点击下方按钮。</p>
      <Button onClick={props.onProceed}>继续</Button>
    </div>
    // <Container fluid="sm" className="mb-5 p-0 rounded shadow-lg">
    // </Container>
  );
};

export default DBError;
