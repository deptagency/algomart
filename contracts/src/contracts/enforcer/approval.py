from pyteal import *

class Constants:
    # Basis point maximum (100%)
    royalty_basis_max = Int(10_000)

    # Basis points go from 0 to 10000 where 100 is 1%
    royalty_basis = Bytes("royalty_basis")

    # Address for the receiver of royalty payments
    royalty_receiver = Bytes("royalty_receiver")


class Selectors:
    set_royalty_policy = MethodSignature("set_royalty_policy(uint64,address)void")
    set_payment_asset = MethodSignature("set_payment_asset(asset,bool)void")
    royalty_free_move = MethodSignature(
        "royalty_free_move(asset,uint64,account,account,uint64,address)void"
    )


@Subroutine(TealType.bytes)
def royalty_basis():
    return App.globalGet(Constants.royalty_basis)


@Subroutine(TealType.bytes)
def royalty_receiver():
    return App.globalGet(Constants.royalty_receiver)


@Subroutine(TealType.none)
def set_royalty_policy(new_royalty_basis: Expr, new_royalty_receiver: Expr):
    return Seq(
        # Uncomment these lines to make policy immutable (optional for ARC-18)
        # current_royalty_basis := App.globalGetEx(Int(0), Constants.royalty_basis),
        # current_royalty_receiver := App.globalGetEx(Int(0), Constants.royalty_receiver),
        # Assert(Not(current_royalty_basis.hasValue())),
        # Assert(Not(current_royalty_receiver.hasValue())),
        Assert(new_royalty_basis <= Constants.royalty_basis_max),
        App.globalPut(Constants.royalty_basis, new_royalty_basis),
        App.globalPut(Constants.royalty_receiver, new_royalty_receiver),
        Approve()
    )


@Subroutine(TealType.none)
def set_payment_asset(asset_id: Expr, is_allowed: Expr):
    return Seq(
        asset_balance := AssetHolding.balance(Global.current_application_address(), asset_id),
        asset_creator := AssetParam.creator(asset_id),
        If(And(is_allowed, Not(asset_balance.hasValue())))
            .Then(
                # Opt-in to asset
                Seq(
                    InnerTxnBuilder.Begin(),
                    InnerTxnBuilder.SetFields({
                        TxnField.type_enum: TxnType.AssetTransfer,
                        TxnField.xfer_asset: asset_id,
                        TxnField.asset_amount: Int(0),
                        TxnField.asset_receiver: Global.current_application_address()
                    }),
                    InnerTxnBuilder.Submit()
                )
            )
        .ElseIf(And(Not(is_allowed), asset_balance.hasValue()))
            .Then(
                # Opt-out of asset
                Seq(
                    InnerTxnBuilder.Begin(),
                    InnerTxnBuilder.SetFields({
                        TxnField.type_enum: TxnType.AssetTransfer,
                        TxnField.xfer_asset: asset_id,
                        TxnField.asset_amount: Int(0),
                        TxnField.asset_close_to: asset_creator.value(),
                        TxnField.asset_receiver: asset_creator.value(),
                    }),
                    InnerTxnBuilder.Submit()
                )
            ),
        Approve()
    )



@Subroutine(TealType.uint64)
def extract_offered_amount(offer: Expr):
    return ExtractUint64(offer, Int(32))


@Subroutine(TealType.bytes)
def extract_offered_authorized_address(offer):
    return Extract(offer, Int(0), Int(32))


@Subroutine(TealType.none)
def update_offer(account: Expr, asset: Expr, authorized_address: Expr, amount: Expr, previous_authorized_address: Expr, previous_amount: Expr):
    return Seq(
        previous := App.localGetEx(account, Int(0), asset),
        If(previous.hasValue())
            .Then(
                Assert(
                    And(
                        extract_offered_amount(previous.value()) == previous_amount,
                        extract_offered_authorized_address(previous.value()) == previous_authorized_address
                    )
                ),
            )
            .Else(
                Assert(
                    And(
                        previous_amount == Int(0),
                        previous_authorized_address == Global.zero_address(),
                    )
                )
            ),
        If(amount > Int(0))
            .Then(
                App.localPut(account, asset, Concat(authorized_address, Itob(amount)))
            )
            .Else(
                App.localDel(account, asset)
            )
    )


def move_asset():
    return Seq()


@Subroutine(TealType.none)
def royalty_free_move(asset_id: Expr, asset_amount: Expr, from_account: Expr, to_account: Expr, previous_offered_amount: Expr, previous_offered_authorized_address: Expr):
    offer = App.localGet(from_account, Itob(asset_id))

    return Seq(
        offered_amount := extract_offered_amount(offer),
        offered_authorized_address := extract_offered_authorized_address(offer),
        Assert(offered_amount == previous_offered_amount),
        Assert(offered_authorized_address == previous_offered_authorized_address),
        Assert(offered_amount <= asset_amount),
        Assert(offered_authorized_address == Global.creator_address()),
        # Delete the existing offer
        update_offer(
            from_account,
            Itob(asset_id),
            Bytes(""),
            Int(0),
            previous_offered_authorized_address,
            previous_offered_amount
        ),

        Approve()
    )

def approval():
    is_sender_creator = Txn.sender() == Global.creator_address()

    action_router = Cond(
        [
            And(Txn.application_args[0] == Selectors.set_royalty_policy, is_sender_creator),
            set_royalty_policy(Btoi(Txn.application_args[1]), Txn.application_args[2]),
        ],
        [
            And(Txn.application_args[0] == Selectors.set_payment_asset, is_sender_creator),
            set_payment_asset(
                Txn.assets[Btoi(Txn.application_args[1])],
                Btoi(Txn.application_args[2])
            ),
        ],
    )

    return Cond(
        [Txn.application_id() == Int(0), Approve()],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_sender_creator)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_sender_creator)],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.NoOp, Return(action_router)],
    )


def compile_approval():
    return compileTeal(
        approval(),
        mode=Mode.Application,
        version=6,
    )


if __name__ == "__main__":
    print(compile_approval())
