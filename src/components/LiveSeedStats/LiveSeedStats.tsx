/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { Button, Col, Container, Row, Form, Stack } from "react-bootstrap";
import "image-capture";

// import VideoViewer from './VideoViewer';
// import ImageBitmapViewer from './ImageBitmapViewer';
import OCRHandler from "./OCRHandler/index";

import SeedDataOutput from "../SeedInfo/SeedDataOutput";
import SeedLinkHandler from "./SeedLinkHandler";
import { useForceUpdate } from "../helpers";

interface IPasteProps {
  onImageBlob: (blob: Blob) => void;
}
const Paste = ({ onImageBlob }: IPasteProps) => {
  const [ripple, setRipple] = useState(false);
  const handlePaste = (event: React.ClipboardEvent) => {
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    var items = (event.clipboardData || ((event as any).originalEvent.clipboardData as DataTransfer)).items;
    for (const index in items) {
      var item = items[index];
      if (item.kind === "file") {
        var blob = item.getAsFile()!;
        onImageBlob(blob);
      }
    }
  };

  const onChange = (file?: Blob) => {
    if (!file) {
      return;
    }
    onImageBlob(file);
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste as any);
    return () => {
      window.removeEventListener("paste", handlePaste as any);
    };
  });

  return (
    <div>
      <h5>粘贴</h5>
      <div
        style={{
          transition: "0.2s",
        }}
        className={`${ripple && "border-info border-1"} border p-2`}
      >
        <p>
          若你不想进行屏幕捕获，可将 Noita 的截图复制到剪贴板，再粘贴到本页面即可. <br />
        </p>
        <table>
          <tbody>
            <tr>
              <td>对于 Linux</td>
              <td>
                {" "}
                <code>Ctrl + PrtSc</code>
              </td>
            </tr>
            <tr>
              <td>对于 Mac </td>
              <td>
                <code>Ctrl + Shift + Cmd + 3</code>
              </td>
            </tr>
            <tr>
              <td className="pe-3">对于 Windows</td>
              <td>
                <code>PrtSc</code>
              </td>
            </tr>
          </tbody>
        </table>
        <br />
        <p>或者，选择一张截图上传.</p>
        <input type="file" onChange={event => onChange(event?.target?.files?.[0] || undefined)} />
      </div>
    </div>
  );
};
// const ocrHandler = new OCRHandler({});

const Description = () => {
  return (
    <div>
      <h5>主机</h5>
      <p>
        这将使你能够获取种子信息（例如来自 <i>种子信息</i>) 在游戏过程中，通过读取你屏幕上的种子，即可实时（获取相关信息）。屏幕数据不会离开你的设备.
        <br />
        <br />
        首先，在浏览器中打开此页面并启动游戏。点击 “开始屏幕捕获”，选择 “Noita” 窗口；若该窗口不可选，则选择 “Noita” 将要运行的整个屏幕.
      </p>
      <p>目前仅支持英文本地化，但未来计划将其打造为语言无关的（产品 / 工具）</p>
      <p>
        在你希望显示种子信息的其他所有窗口中，输入下方代码即可。（你甚至可以分享该代码）!)
      </p>
      <p></p>
    </div>
  );
};

interface IHostProps {
  ready: boolean;
  recording: boolean;
  hostRoom?: string;
  onClickStartHosting: () => void;
  onClickStopHosting: () => void;
}

const Host = (props: IHostProps) => {
  const { ready, hostRoom, recording, onClickStartHosting, onClickStopHosting } = props;
  return (
    <Stack gap={1}>
      <Description />
      {!recording ? (
        <Button disabled={!ready} onClick={() => onClickStartHosting()}>
          开始屏幕捕获
        </Button>
      ) : (
        <Button disabled={!ready} onClick={() => onClickStopHosting()}>
          停止屏幕捕获
        </Button>
      )}
      {recording ? <div>录制</div> : null}
      {hostRoom ? (
        <div>
          <h3>使用这个代码 {hostRoom}</h3>
        </div>
      ) : null}
    </Stack>
  );
};

interface IWatchProps {
  ready: boolean;
  room?: string;
  onSetRoom: (room: string) => void;
  onReset: () => void;
  seed?: string;
}
const Watch = (props: IWatchProps) => {
  const { onSetRoom, onReset, seed, room } = props;

  const formRef = useRef(null);

  const [val, setVal] = useState("");

  const handleChange = (e: any) => {
    if (e.target.validity.valid) {
      setVal(e.target.value);
    } else if (val === "" || val === "-") {
      setVal(val);
    }
  };

  return (
    <div>
      <Row>
        <h5>观察</h5>
      </Row>
      <Row>
        <Form
          ref={formRef}
          onSubmit={e => {
            e.preventDefault();
            onSetRoom((e.target as any).elements.code.value);
          }}
        >
          <Row className="align-items-end">
            <Form.Group as={Col} xs={12} sm={12} md={9} controlId="code">
              <Form.Label>输入代码以追踪</Form.Label>
              <Form.Control
                onChange={handleChange}
                value={val}
                size="lg"
                type="tel"
                pattern="[0-9]*"
                placeholder="代码"
              />
            </Form.Group>
            <Col xs={12} sm={4} md={3} className="pt-2">
              <Button className="mb-1" variant="primary" type="submit">
                连接
              </Button>
              <Button className="mb-1" variant="secondary" type="button" onClick={() => onReset()}>
                重置卡住的 OCR 功能
              </Button>
            </Col>
          </Row>
        </Form>
      </Row>
      {room ? <p className="mt-2 text-success">连接到 {room}</p> : null}
      {seed ? <SeedDataOutput seed={seed} /> : null}
    </div>
  );
};

const canvasDebug = false;

const LiveSeedStats = () => {
  // We need a way for the OCR handler to notify of a state change.
  // Maybe refactoring this is the way to go, but I'm not sure how to
  // make it simpler?
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [lastSeed, setLastSeed] = useState<string>();
  const forceUpdate = useForceUpdate();

  const [ocrHandler, setOcrHandler] = useState<OCRHandler>(() => {
    const ocrHandler = new OCRHandler({
      onUpdate: forceUpdate,
      canvasRef: canvasDebug ? canvasRef : undefined,
    });
    ocrHandler.addEventListener("seed", (event: any) => {
      if (event.detail.seed) {
        setLastSeed(event.detail.seed);
        seedLink!.sendSeed(event.detail.seed);
      }
    });
    return ocrHandler;
  });
  const [seedLink] = useState<SeedLinkHandler>(() => {
    const seedLinkHandler = new SeedLinkHandler({
      onUpdate: forceUpdate,
    });
    seedLinkHandler.addEventListener("update", () => {
      forceUpdate();
    });
    seedLinkHandler.addEventListener("restart", () => {
      ocrHandler!.restart().finally(() => {});
    });
    return seedLinkHandler;
  });

  useEffect(() => {
    const ocrHandler = new OCRHandler({
      onUpdate: forceUpdate,
      canvasRef: canvasDebug ? canvasRef : undefined,
    });
    ocrHandler.addEventListener("seed", (event: any) => {
      if (event.detail.seed) {
        setLastSeed(event.detail.seed);
        seedLink!.sendSeed(event.detail.seed);
      }
    });
    setOcrHandler(ocrHandler);
  }, [seedLink]);

  const onClickScannerStart = async () => {
    await ocrHandler?.startCapture({});
    await seedLink?.host();
  };
  const onClickScannerStop = async () => {
    await ocrHandler?.stopCapture();
  };
  const ocrReady = Boolean(ocrHandler?.ready);
  const socketReady = Boolean(seedLink?.ready);
  const everythingReady = ocrReady && socketReady;

  return (
    <Container className="container shadow-lg">
      {canvasDebug && <canvas style={{}} ref={canvasRef} />}
      <h4>实时种子数据</h4>
      {!everythingReady ? (
        <div>加载中...</div>
      ) : (
        <Stack>
          <Col className="mb-5" xs={12}>
            <Watch
              onReset={() => seedLink.sendRestart()}
              ready={socketReady}
              room={seedLink?.room}
              onSetRoom={room => seedLink?.joinRoom(room)}
              seed={lastSeed || seedLink?.seed}
            />
          </Col>
          <Col className="mb-5" xs={12}>
            <Host
              ready={everythingReady}
              hostRoom={seedLink?.hostRoom}
              recording={!!ocrHandler?.mediaStream}
              onClickStartHosting={onClickScannerStart}
              onClickStopHosting={onClickScannerStop}
            />
          </Col>
          <Col className="mb-5" id="ocr-paste" xs={12}>
            <Paste onImageBlob={blob => ocrHandler.doSingleDetect(blob)} />
          </Col>
        </Stack>
      )}
    </Container>
  );
};

export default LiveSeedStats;
