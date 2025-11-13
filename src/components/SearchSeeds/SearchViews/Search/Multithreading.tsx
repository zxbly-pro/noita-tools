import React, { useContext } from "react";
import {
  Container,
  Stack,
  Row,
  Col,
  ListGroup,
  Button,
  ButtonGroup,
  Form,
  FormGroup,
  ProgressBar,
} from "react-bootstrap";
import humanize from "humanize-duration";

import UseMultithreadingButton from "../../UseMultithreading";

const Multithreading = () => {
  return (
    <Col md={12} className="">
      <Row className="m-3">
        <UseMultithreadingButton />
      </Row>
      <Row className="m-3">
        <p>
          多线程将使用在设置中设定的 CPU 线程数量，但会降低你的电脑运行速度。电脑性能可能会受影响，电池续航时间也可能缩短。.
        </p>
      </Row>
    </Col>
  );
};

export default Multithreading;
