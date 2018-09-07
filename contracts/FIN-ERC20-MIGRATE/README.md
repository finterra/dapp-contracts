# FIN ERC20 Ethereum to FIN ERC777 Gallactic Migration Contract

This contract is built to migrate existing FIN ERC20 balances from the Ethereum network to the Gallactic network once it goes live.

Once the migration is activated on the FIN ERC20 contract by the contract owner, all regular transfers are frozen.

Balance holding accounts can the call the initaiteMigration function on this contract, which will call the migrateTransfer function of the FIN ERC20 contract to record the account's balance in a map on this contract. That account's balance will then be set to 0 on the Ethereum network, awaiting migration of balances to the Gallactic network.

This proccess can be done several times if necessary. Each time, the transaction ID of the initiateMigration function call must be used as proof to complete migration to the Gallactic network.