import React, { FC, useState, Suspense, useEffect, useContext, lazy } from "react";
import { Container, Button, Row, Modal } from "react-bootstrap";
import { useSearchParamsState } from "react-use-search-params-state";

import "./App.css";
import { ThemeProvider } from "./ThemeContext";
import { AlchemyConfigProvider } from "./AlchemyConfigContext";

import LoadingComponent from "./LoadingComponent";
import { db } from "../services/db";
import { BrowserRouter, useLocation, useSearchParams } from "react-router-dom";
import DBError from "./DBError";
import { ProfileContext, ProfileProvider } from "./Profile/ProfileContext";

const Settings = lazy(() => import("./Settings"));
const LazySettings = () => {
  const [show, setShow] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [filterParams, setFilterParams] = useSearchParamsState({
    settings: {
      type: "boolean",
      default: false,
    },
  });

  const handleSettings = () => {
    if (!show) {
      setFilterParams({ settings: true });
      setShow(true);
    } else {
      // delete the param outright - I don't like settings=false in the url
      searchParams.delete("settings");
      setSearchParams(searchParams);
      setShow(false);
    }
  };

  return (
    <Suspense fallback={<LoadingComponent />}>
      <Button onClick={() => handleSettings()} size="lg" variant="outline-primary">
        <i className="bi bi-gear"></i>
      </Button>
      <Settings show={show || filterParams.settings} handleClose={() => handleSettings()} />
    </Suspense>
  );
};

const Profile = lazy(() => import("./Profile"));
const LazyProfile = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterParams, setFilterParams] = useSearchParamsState({
    profile: {
      type: "boolean",
      default: false,
    },
  });

  const profileOpen = filterParams.profile;

  const { patreonData } = useContext(ProfileContext);

  const handleProfile = () => {
    if (!profileOpen) {
      setFilterParams({ profile: true });
    } else {
      // delete the param outright - I don't like profile=false in the url
      searchParams.delete("profile");
      setSearchParams(searchParams);
    }
  };

  return (
    <Suspense fallback={<LoadingComponent />}>
      <Button onClick={() => handleProfile()} size="lg" variant="outline-primary">
        {patreonData?.avatar ? (
          <img
            src={patreonData.avatar}
            alt="profile"
            className="rounded-circle"
            style={{ width: "2rem", height: "2rem" }}
          />
        ) : (
          <i className="bi bi-person"></i>
        )}
      </Button>
      <Profile show={profileOpen} handleClose={() => handleProfile()} />
    </Suspense>
  );
};

const Header = () => {
  return (
    <Container fluid="sm" className="mb-2 p-0 d-flex justify-content-between px-2">
      <div className="text-nowrap lh-1">
        <h3 className="fs-1 fw-bolder mb-0 text-center position-relative pb-2">
          <a href="/" className="text-decoration-none text-reset">
            Noitool
          </a>
        </h3>
        <p className="fs-4 fw-light m-1 mt-0 my-1 text-center">Noita 工具与助手</p>
      </div>
      <div className=" d-flex pt-2 justify-content-end align-items-start">
        {/* <div className="mx-2">
          <LazyProfile />
        </div> */}
        <div className="mx-2">
          <LazySettings />
        </div>
      </div>
    </Container>
  );
};

const WasmError = (props: any) => {
  return (
    <div className="position-absolute top-50 start-50 translate-middle text-center w-75">
      <p>此浏览器似乎不支持 WebAssembly，而运行生成代码需要它。</p>
      <p>
        这可能由多种原因导致。某些浏览器安全配置会关闭 WebAssembly。某些浏览器不支持它。<br />
        一个常见问题是 Edge 浏览器的增强安全配置会关闭 WebAssembly。
      </p>
      <p>
        查看{" "}
        <a href="https://webassembly.org/roadmap/" target="_blank" rel="noreferrer">
          此页面
        </a>{" "}
        了解哪些浏览器支持它。
      </p>
      <p>如果您确定此消息是错误的，请点击下方按钮。</p>
      <Button onClick={props.onProceed}>继续</Button>
    </div>
  );
};

const Body = lazy(() => import("./Body"));
const LazyBody = (props: any) => {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <Body {...props} />
    </Suspense>
  );
};

const Footer = () => {
  return null;
};

interface IOutdatedVersionHandlerProps {
  children?: React.ReactNode;
}
const OutdatedVersionHandler: FC<IOutdatedVersionHandlerProps> = props => {
  return <>{props.children}</>;
};

interface IDBErrorHandlerProps {
  children?: React.ReactNode;
}
const DBErrorHandler: FC<IDBErrorHandlerProps> = props => {
  const [hasDBError, setHasDBError] = useState<Error | boolean>(false);

  useEffect(() => {
    db.errorOnOpen
      .then(e => {
        setHasDBError(e);
      })
      .finally(() => {});
  }, []);

  let toShow = <>{props.children}</>;

  if (hasDBError) {
    toShow = <DBError error={hasDBError} onProceed={() => setHasDBError(false)} />;
  }

  return toShow;
};

const App: FC = () => {
  const [hasWasm, setHasWasm] = useState(() => {
    try {
      // https://github.com/MaxGraey/wasm-check/issues/5
      // return wasmCheck.support()
      return typeof WebAssembly === "object";
    } catch (e) {
      console.error(e);
      return false;
    }
  });

  // Session token not needed for offline mode

  let toShow = <LazyBody />;

  if (!hasWasm) {
    toShow = <WasmError onProceed={() => setHasWasm(true)} />;
  }

  return (
    <OutdatedVersionHandler>
      <DBErrorHandler>
        <BrowserRouter>
          <div className="App bg-gradient">
            <div className="content bg-body rounded" style={{ minHeight: "85vh" }}>
              <ThemeProvider>
                <AlchemyConfigProvider>
                  <Header />
                  {toShow}
                </AlchemyConfigProvider>
              </ThemeProvider>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </DBErrorHandler>
    </OutdatedVersionHandler>
  );
};

export default App;
