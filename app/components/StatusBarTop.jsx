import React from "react";
import { StatusBar as RNStatusBar } from "react-native";

const StatusBarTop = ({ backgroundColor: bgProp } = {}) => {
  const backgroundColor = bgProp || "#0B0D0C";

  return (
    <RNStatusBar
      backgroundColor={backgroundColor}
      barStyle="light-content"
      translucent={false}
    />
  );
};

export default StatusBarTop;