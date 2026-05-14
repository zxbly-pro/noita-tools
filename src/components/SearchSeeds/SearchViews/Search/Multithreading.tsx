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
          多线程将使用设置中指定数量的CPU线程，但会降低电脑性能。电脑运行速度和电池续航可能会受到影响。
        </p>
      </Row>
    </Col>
  );
};

export default Multithreading;
