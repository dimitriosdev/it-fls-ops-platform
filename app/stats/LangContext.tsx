"use client";

import { createContext, useContext } from "react";
import { DICT } from "./i18n";
import type { Lang } from "./i18n";

export const LangContext = createContext<Lang>("de");
export const useT = () => DICT[useContext(LangContext)];
