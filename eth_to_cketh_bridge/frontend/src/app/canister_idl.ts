import { IDL } from "@dfinity/candid";

export const idlFactory = ({ IDL }: any) => {
  return IDL.Service({
    // Withdraw expects an object with two fields: amount (Nat) and ethAddress (Text)
    withdraw: IDL.Func(
      [IDL.Record({ amount: IDL.Nat, ethAddress: IDL.Text })], 
      [IDL.Text], // The return type (Text)
      []
    ),
  });
};


