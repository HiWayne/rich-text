import { useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import {
  ContentBlock,
  DraftEditorCommand,
  Editor,
  EditorBlock,
  EditorState,
  RichUtils,
} from "draft-js";
import { Button, Divider, Input, Popover, Tooltip, Select } from "antd";
import {
  LeftOutlined,
  StarOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { throttling } from "@duitang/dt-base";
import CopyToClipboard from "react-copy-to-clipboard";
import useStore from "store/index";
import shallow from "zustand/shallow";
import UserInfo from "../components/UserInfo";
import { getParams } from "../util/getParams";
import ToolBar from "components/ToolBar";
import BlockQuote from "components/customDocRenders/BlockQuote";
import { TOOL_ITEM_NAMES } from "components/ToolBar/ToolItems";

const { Option } = Select;

const ICON_STYLE = {
  fontSize: "20px",
  margin: "0 20px",
};

const TopTool = styled.div`
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  padding: 0 20px;
  border-bottom: 0.5px solid #444444;
`;

const InnerLeft = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const DocsName = styled.h1`
  outline: none;
  border: 1px solid rgba(0, 0, 0, 0);
  overflow: hidden;
  white-space: nowrap;
  -o-text-overflow: ellipsis;
  text-overflow: ellipsis;
  color: var(--text-title);
  font-size: 14px;
  line-height: 20px;
  padding: 0 5px;
`;

const LatestTime = styled.span`
  color: #777;
  font-size: 10px;
`;

const HoverIcon = styled.div`
  &:hover {
    background: #444444;
    opacity: 0.5;
    // height: auto;
    // width: auto;
    border-radius: 5px;
  }
`;
const Main = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 5px;
  width: 100%;
  height: auto;
`;

const NavBar = styled.div`
  max-width: 120px;
  height: auto;
`;

const Content = styled.div`
  width: 70%;
`;

const id = getParams(window.location.search);

const editorStyleMap = {
  CODE: {
    marginLeft: "2px",
    marginRight: "2px",
    paddingLeft: "2px",
    paddingRight: "2px",
    borderRadius: "3px",
    border: "1px solid var(--line-border-card)",
    backgroundColor: "var(--bg-body-overlay)",
  },
};

const myBlockStyleFn = (contentBlock: ContentBlock) => {
  const type = contentBlock.getType();
  switch (type) {
    case TOOL_ITEM_NAMES.BLOCK_QUOTE:
      return "customBlockquote";
    case TOOL_ITEM_NAMES.CODE_BLOCK:
      return "language-prism"
    default:
      return null as any;
  }
};

// const myBlockRenderer = (contentBlock: ContentBlock) => {
//   switch (contentBlock.getType()) {
//     case TOOL_ITEM_NAMES.BLOCK_QUOTE:
//       return {
//         component: BlockQuote,
//         editable: true,
//         props: {},
//       };
//     default:
//       return;
//   }
// };

/**
 *
 * @description ???????????????????????????
 * inline: ?????? bold????????? i???????????????????????????????????????????????????????????????????????????
 * block: ?????? H1-H9????????????????????????????????????????????????????????????????????????????????????????????????????????????
 *
 */

const DocContent = () => {
  const [editorState, setEditorState] = useStore(
    (state) => [state.editorState, state.setEditorState],
    shallow
  );
  const [title, setTitle] = useState("");
  const [lastUpdateTimeText, setLastUpdateTimeText] = useState("");
  const [renderContent, setRenderContent] = useState("");

  const lastUpdateTimeRef = useRef(0);
  const textAreaRef = useRef(null);
  const linkRef = useRef(null);

  const handleChangePermission = () => {};

  const content = (
    <div>
      <Input
        ref={linkRef}
        addonBefore={
          <Select
            defaultValue="???????????????????????????"
            style={{ width: 200 }}
            onChange={handleChangePermission}
          >
            <Option value="?????????">???????????????????????????</Option>
            <Option value="?????????">???????????????????????????</Option>
          </Select>
        }
        suffix={
          <CopyToClipboard text={window.location.href}>
            <span>??????????????????</span>
          </CopyToClipboard>
        }
        value={window.location.href}
      ></Input>
    </div>
  );

  const handleCollect = () => {
    console.log("collect");
  };

  // ???????????????????????????????????????0.2s????????????????????????
  const updateLastTime = useMemo(
    () =>
      throttling(() => {
        lastUpdateTimeRef.current = new Date().getTime();
      }, 200),
    []
  );

  useEffect(() => {
    // TODO: ?????????????????????????????????lastUpdateTime??????????????????7?????????????????????
    const randomLastUpdateTime =
      new Date().getTime() - Math.ceil(Math.random() * 60000 * 60 * 24 * 7);

    lastUpdateTimeRef.current = randomLastUpdateTime;

    const updateTimeText = () => {
      const duration = new Date().getTime() - lastUpdateTimeRef.current;
      let value = 1,
        suffix = "min???";
      if (duration < 60000 * 60) {
        suffix = "min???";
        value = Math.floor(duration / 60000);
      } else if (duration >= 60000 * 60 && duration < 60000 * 60 * 24) {
        suffix = "hour???";
        value = Math.floor(duration / (60000 * 60));
      } else if (
        duration >= 60000 * 60 * 24 &&
        duration < 60000 * 60 * 24 * 30
      ) {
        suffix = "day???";
        value = Math.floor(duration / (60000 * 60 * 24));
      } else if (
        duration >= 60000 * 60 * 24 * 30 &&
        duration < 60000 * 60 * 24 * 30 * 12
      ) {
        suffix = "??????";
        value = Math.floor(duration / (60000 * 60 * 24 * 30));
      } else if (duration >= 60000 * 60 * 24 * 30 * 12) {
        suffix = "??????";
        value = Math.floor(duration / (60000 * 60 * 24 * 30 * 12));
      }
      const timeText = Math.max(value, 1) + suffix;
      setLastUpdateTimeText(timeText);
    };

    updateTimeText();

    // ?????????????????????????????????
    const timer = setInterval(updateTimeText, 60000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleKeyCommand = (
    command: DraftEditorCommand,
    editorState: EditorState
  ) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      setEditorState(newState);
      return "handled";
    }

    return "not-handled";
  };

  return (
    <div>
      <TopTool>
        <InnerLeft>
          <LeftOutlined />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <DocsName>{title ? title : "???????????????"}</DocsName>
              <HoverIcon>
                <Tooltip placement="bottom" title="???????????????">
                  <StarOutlined onClick={handleCollect} />
                </Tooltip>
              </HoverIcon>
            </div>
            <LatestTime>
              {lastUpdateTimeText ? `????????????: ${lastUpdateTimeText}` : ""}
            </LatestTime>
          </div>
        </InnerLeft>
        <InnerLeft>
          <Popover
            placement="bottom"
            title="????????????"
            content={content}
            trigger="click"
          >
            <Button
              type="primary"
              style={{
                borderRadius: "5px",
                marginRight: "20px",
              }}
            >
              ??????
            </Button>
          </Popover>
          <Divider type="vertical" style={{ height: "30px" }} />
          <HoverIcon>
            <Tooltip placement="bottom" title="????????????">
              <SearchOutlined style={ICON_STYLE} />
            </Tooltip>
          </HoverIcon>
          <HoverIcon>
            <Tooltip placement="bottom" title="????????????">
              <PlusOutlined style={ICON_STYLE} />
            </Tooltip>
          </HoverIcon>
          <UserInfo></UserInfo>
        </InnerLeft>
      </TopTool>
      <Main>
        <NavBar></NavBar>
        <Divider type="vertical" style={{ height: "auto" }}></Divider>
        <Content ref={textAreaRef}>
          <ToolBar></ToolBar>
          <Editor
            blockStyleFn={myBlockStyleFn}
            // blockRendererFn={myBlockRenderer}
            customStyleMap={editorStyleMap}
            editorState={editorState}
            onChange={setEditorState}
            handleKeyCommand={handleKeyCommand}
            spellCheck={true}
            placeholder="Tell a story..."
          />
        </Content>
      </Main>
    </div>
  );
};

export default DocContent;
