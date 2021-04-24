import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux"
import { AppDispatch, RootState } from "./store"

// Use custom hooks for typing
// eslint-disable-next-line
export const dispatch: any = () => useDispatch<AppDispatch>();
export const selector: TypedUseSelectorHook<RootState> = useSelector;