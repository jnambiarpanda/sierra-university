// Copyright Sierra

import { makeIntegration } from "@sierra/agent";
import definition from "./definition";
export * from "./types";
import api from "./api";

export default makeIntegration({ definition, api });
