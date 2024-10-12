import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import List "mo:base/List";

actor EthToCkEthBridge {

    stable var balances: List.List<(Text, Nat)> = List.nil<(Text, Nat)>();  // Track balances

    public type WithdrawalRequest = {
        ethAddress: Text;
        amount: Nat;
    };

    // Deposit function called from the backend (after Ethereum deposit detected)
    public func deposit(ethAddress: Text, amount: Nat) : async Text {
        balances := updateBalance(ethAddress, amount, true);
        Debug.print(debug_show({ ethAddress = ethAddress; amount = amount }));
        return "Deposit successful!";
    };

    // Withdrawal function
    public func withdraw(req: WithdrawalRequest) : async Text {
        Debug.print(debug_show(req));  // Log the request
        if (req.amount == 0) {
            return "Invalid withdrawal amount.";
        };

        let currentBalance: ?Nat = findBalance(req.ethAddress);
        switch (currentBalance) {
            case (null) {
                return "Withdrawal failed: No balance found.";
            };
            case (?balance) {
                if (balance < req.amount) {
                    return "Withdrawal failed: Insufficient balance.";
                }
            };
        };

        balances := updateBalance(req.ethAddress, req.amount, false);  // Deduct from balance
        return "Withdrawal successful!";
    };

    // Get user balance
    public query func getBalance(ethAddress: Text) : async Nat {
        let currentBalance: ?Nat = findBalance(ethAddress);
        switch (currentBalance) {
            case (null) { return 0 };
            case (?balance) { return balance };
        }
    };

    // Update user balance
    func updateBalance(ethAddress: Text, amount: Nat, isDeposit: Bool) : List.List<(Text, Nat)> {
        let currentBalance: ?Nat = findBalance(ethAddress);
        let newBalance: Nat = switch (currentBalance) {
            case (null) {
                if (isDeposit) { amount } else { 0 };
            };
            case (?balance) {
                if (isDeposit) {
                    balance + amount;
                } else {
                    if (balance >= amount) { balance - amount } else { balance };
                }
            };
        };
        return replaceBalance(ethAddress, newBalance);
    };

    // Helper functions for finding and replacing balance
    func findBalance(ethAddress: Text) : ?Nat {
        let result: ?(Text, Nat) = List.find<(Text, Nat)>(balances, func ((address, _)) { address == ethAddress });
        switch (result) {
            case (null) { return null };
            case (?(_, balance)) { return ?balance };
        }
    };

    func replaceBalance(ethAddress: Text, newBalance: Nat) : List.List<(Text, Nat)> {
        return List.map<(Text, Nat), (Text, Nat)>(balances, func ((address, balance)) {
            if (address == ethAddress) {
                (address, newBalance);
            } else {
                (address, balance);
            }
        });
    };
}
