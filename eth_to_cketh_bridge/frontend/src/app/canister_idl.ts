// canister_idl.ts
import { IDL } from "@dfinity/candid";

export const idlFactory = ({ IDL }: any) => {
  return IDL.Service({
    withdraw: IDL.Func([IDL.Nat], [IDL.Bool], []),  // Example function
  });
};
