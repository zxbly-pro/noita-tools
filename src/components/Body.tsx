import { useEffect, useContext } from "react";
import { Container, Tabs, Tab } from "react-bootstrap";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SearchSeeds from "./SearchSeeds";
import SeedInfo from "./SeedInfo";

import { Compute, ComputeConsole } from "./Compute";
import { ProfileContext } from "./Profile/ProfileContext";

import { isLocal } from "./utils";

const Body = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const seedInSearchParams = searchParams.get("seed");

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { patreonData } = useContext(ProfileContext);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    if (seedInSearchParams) {
      navigate(
        {
          pathname: "/info",
          search: window.location.search,
        },
        { replace: true },
      );
    } else {
      navigate("/info", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTab = key => {
    navigate(key);
  };

  const showClusterComputeConsole = false;

  return (
    <Container fluid="sm" className="mb-5 p-0 rounded shadow-lg">
      <Tabs activeKey={pathname} onSelect={handleTab} id="main-tabs" mountOnEnter className="">
        <Tab eventKey="/info" title="种子信息">
          <SeedInfo />
        </Tab>
        <Tab eventKey="/search" title="搜索种子">
          <SearchSeeds />
        </Tab>
        <Tab eventKey="/compute" title="计算池">
          <Compute />
        </Tab>
        {showClusterComputeConsole && (
          <Tab eventKey="/compute-console" title="计算控制台">
            <ComputeConsole />
          </Tab>
        )}
      </Tabs>
    </Container>
  );
};

export default Body;
