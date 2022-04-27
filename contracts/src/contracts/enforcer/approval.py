from pyteal import *
from typing import Literal


class Keys:
    # Holds the current administrator
    administrator = Bytes("administrator")

    # Holds the basis points taken out for the royalty payment (1% = 100 bp)
    royalty_basis = Bytes("royalty_basis")

    # Holds the royalty recipient address
    royalty_receiver = Bytes("royalty_receiver")


class Constants:
    # 10_000 basis points = 100%
    basis_point_multiplier = 10_000


class Selectors:
    set_administrator = MethodSignature("set_administrator(address)void")
    get_administrator = MethodSignature("get_administrator()address")

    offer = MethodSignature("offer(asset,uint64,address,uint64,address)void")
    get_offer = MethodSignature("get_offer(uint64,account)(address,uint64)")

    set_policy = MethodSignature("set_policy(uint64,address)void")
    get_policy = MethodSignature("get_policy()(address,uint64)")

    set_payment_asset = MethodSignature("set_payment_asset(asset,bool)void")

    transfer = MethodSignature(
        "transfer(asset,uint64,account,account,account,txn,asset,uint64)void"
    )

    royalty_free_move = MethodSignature(
        "royalty_free_move(asset,uint64,account,account,uint64)void"
    )

#region Administrator

@Subroutine(TealType.bytes)
def administrator():
    return Seq(
        (admin := App.globalGetEx(Int(0), Keys.administrator)),
        If(admin.hasValue(), admin.value(), Global.creator_address())
    )


@Subroutine(TealType.uint64)
def set_administrator():
    return Seq(
        (new_admin := abi.Address()).decode(Txn.application_args[1]),
        put_administrator(new_admin.encode()),
    )


@Subroutine(TealType.uint64)
def put_administrator(admin: Expr):
    return Seq(
        App.globalPut(Keys.administrator, admin),
        Int(1)
    )


@Subroutine(TealType.uint64)
def get_administrator():
    return Seq(
        (admin := abi.Address()).decode(administrator()),
        abi.MethodReturn(admin),
        Int(1)
    )

#endregion

#region Offer

@Subroutine(TealType.uint64)
def offered_amount(offer):
    return ExtractUint64(offer, Int(32))


@Subroutine(TealType.bytes)
def offered_auth(offer):
    return Extract(offer, Int(0), Int(32))


@Subroutine(TealType.uint64)
def offer():
    asset_id = Txn.assets[Btoi(Txn.application_args[1])]
    asset_amt = Btoi(Txn.application_args[2])

    auth_acct = Txn.application_args[3]
    prev_amt = Btoi(Txn.application_args[4])

    prev_auth = Txn.application_args[5]

    return Seq(
        cb := AssetParam.clawback(asset_id),
        bal := AssetHolding.balance(Txn.sender(), asset_id),
        # Check that caller _has_ this asset
        Assert(bal.value() >= asset_amt),
        # Check that this app is the clawback for it
        Assert(And(cb.hasValue(), cb.value() == Global.current_application_address())),
        # Set the auth addr for this asset
        update_offered(
            Txn.sender(), Itob(asset_id), auth_acct, asset_amt, prev_auth, prev_amt
        ),
        Int(1),
    )


@Subroutine(TealType.none)
def update_offered(acct, asset, auth, amt, prev_auth, prev_amt):
    return Seq(
        previous := App.localGetEx(acct, Int(0), asset),
        # If we had something before, make sure its the same as what was passed. Otherwise make sure that a 0 was passed
        If(
            previous.hasValue(),
            Assert(
                And(
                    offered_amount(previous.value()) == prev_amt,
                    offered_auth(previous.value()) == prev_auth,
                )
            ),
            Assert(And(prev_amt == Int(0), prev_auth == Global.zero_address())),
        ),
        # Now consider the new offer, if its 0 this is a delete, otherwise update
        If(
            amt > Int(0),
            App.localPut(acct, asset, Concat(auth, Itob(amt))),
            App.localDel(acct, asset),
        ),
    )


@Subroutine(TealType.uint64)
def get_offer():
    offered_asset = Txn.application_args[1]
    offering_acct = Txn.accounts[Btoi(Txn.application_args[2])]

    return Seq(
        stored_offer := App.localGetEx(offering_acct, Int(0), offered_asset),
        Assert(stored_offer.hasValue()),
        (addr := abi.Address()).decode(offered_auth(stored_offer.value())),
        (amt := abi.Uint64()).set(offered_amount(stored_offer.value())),
        (ret := abi.Tuple(abi.AddressTypeSpec(), abi.Uint64TypeSpec())).set(addr, amt),
        abi.MethodReturn(ret),
        Int(1),
    )

#endregion

#region Policy

@Subroutine(TealType.bytes)
def royalty_receiver():
    return App.globalGet(Keys.royalty_receiver)


@Subroutine(TealType.uint64)
def royalty_basis():
    return App.globalGet(Keys.royalty_basis)


@Subroutine(TealType.uint64)
def set_policy():
    return Seq(
        (r_basis := abi.Uint64()).decode(Txn.application_args[1]),
        (r_recv := abi.Address()).decode(Txn.application_args[2]),
        (r_basis_stored := App.globalGetEx(Int(0), Keys.royalty_basis)),
        (r_recv_stored := App.globalGetEx(Int(0), Keys.royalty_receiver)),
        Assert(Not(r_basis_stored.hasValue())),
        Assert(Not(r_recv_stored.hasValue())),
        Assert(r_basis.get() <= Int(Constants.basis_point_multiplier)),
        App.globalPut(Keys.royalty_basis, r_basis.get()),
        App.globalPut(Keys.royalty_receiver, r_recv.get()),
        Int(1),
    )


@Subroutine(TealType.uint64)
def get_policy():
    return Seq(
        (addr := abi.Address()).decode(royalty_receiver()),
        (amt := abi.Uint64()).set(royalty_basis()),
        (ret := abi.Tuple(abi.AddressTypeSpec(), abi.Uint64TypeSpec())).set(addr, amt),
        abi.MethodReturn(ret),
        Int(1),
    )

#endregion

#region Payment asset

@Subroutine(TealType.uint64)
def set_payment_asset():
    asset_id = Txn.assets[Btoi(Txn.application_args[1])]
    is_allowed = Btoi(Txn.application_args[2])

    # TODO: how should this handle the min balance increase/decrease?

    return Seq(
        bal := AssetHolding.balance(Global.current_application_address(), asset_id),
        creator := AssetParam.creator(asset_id),
        Assert(Txn.fee() >= Int(2000)),
        If(And(is_allowed, Not(bal.hasValue())))
        .Then(
            # Opt in to asset
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.AssetTransfer,
                        TxnField.xfer_asset: asset_id,
                        TxnField.asset_amount: Int(0),
                        TxnField.asset_receiver: Global.current_application_address(),
                        TxnField.fee: Int(0),
                    }
                ),
                InnerTxnBuilder.Submit(),
            ),
        )
        .ElseIf(And(Not(is_allowed), bal.hasValue()))
        .Then(
            # Opt out, close asset to asset creator
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.AssetTransfer,
                        TxnField.xfer_asset: asset_id,
                        TxnField.asset_amount: Int(0),
                        TxnField.asset_close_to: creator.value(),
                        TxnField.asset_receiver: creator.value(),
                        TxnField.fee: Int(0),
                    }
                ),
                InnerTxnBuilder.Submit(),
            ),
        ),
        Int(1),
    )

#endregion

#region Transfer

@Subroutine(TealType.uint64)
def royalty_amount(payment_amt, royalty_basis):
    return WideRatio([payment_amt, royalty_basis], [Int(Constants.basis_point_multiplier)])


@Subroutine(TealType.none)
def pay_assets(purchase_asset_id, purchase_amt, owner, royalty_receiver, royalty_basis):
    royalty_amt = ScratchVar()
    return Seq(
        royalty_amt.store(royalty_amount(purchase_amt, royalty_basis)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: purchase_asset_id,
                TxnField.asset_amount: purchase_amt - royalty_amt.load(),
                TxnField.asset_receiver: owner,
                TxnField.fee: Int(0),
            }
        ),
        If(
            royalty_amt.load() > Int(0),
            Seq(
                InnerTxnBuilder.Next(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.AssetTransfer,
                        TxnField.xfer_asset: purchase_asset_id,
                        TxnField.asset_amount: royalty_amt.load(),
                        TxnField.asset_receiver: royalty_receiver,
                        TxnField.fee: Int(0),
                    }
                ),
            ),
        ),
        InnerTxnBuilder.Submit(),
    )


@Subroutine(TealType.none)
def pay_algos(purchase_amt, owner, royalty_receiver, royalty_basis):
    royalty_amt = ScratchVar()
    return Seq(
        royalty_amt.store(royalty_amount(purchase_amt, royalty_basis)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: purchase_amt - royalty_amt.load(),
                TxnField.receiver: owner,
                TxnField.fee: Int(0),
            }
        ),
        If(
            royalty_amt.load() > Int(0),
            Seq(
                InnerTxnBuilder.Next(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.amount: royalty_amt.load(),
                        TxnField.receiver: royalty_receiver,
                        TxnField.fee: Int(0),
                    }
                ),
            ),
        ),
        InnerTxnBuilder.Submit(),
    )


@Subroutine(TealType.none)
def move_asset(asset_id, from_addr, to_addr, asset_amt):
    # TODO: should we check that this should be a close_to?
    return Seq(
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset_id,
                TxnField.asset_amount: asset_amt,
                TxnField.asset_sender: from_addr,
                TxnField.asset_receiver: to_addr,
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
    )


@Subroutine(TealType.uint64)
def transfer():
    asset_id = Txn.assets[Btoi(Txn.application_args[1])]
    asset_amt = Btoi(Txn.application_args[2])
    owner_acct = Txn.accounts[Btoi(Txn.application_args[3])]
    buyer_acct = Txn.accounts[Btoi(Txn.application_args[4])]
    royalty_acct = Txn.accounts[Btoi(Txn.application_args[5])]
    purchase_txn = Gtxn[Txn.group_index() - Int(1)]
    # Unused, just passed in args to let the app have access in foreign assets
    # asset_idx  = Txn.application_args[6]
    curr_offered_amt = Btoi(Txn.application_args[7])

    # Get the auth_addr from local state of the owner
    # If its not present, a 0 is returned and the call fails when we try
    # to compare to the bytes of Txn.sender
    offer = App.localGet(owner_acct, Itob(asset_id))
    offer_auth_addr = offered_auth(offer)
    offer_amt = offered_amount(offer)

    stored_royalty_recv = ScratchVar(TealType.bytes)
    stored_royalty_basis = ScratchVar(TealType.uint64)

    valid_transfer_group = And(
        Global.group_size() == Int(2),
        # App call sent by authorizing address
        Txn.sender() == offer_auth_addr,
        # No funny business
        purchase_txn.rekey_to() == Global.zero_address(),
        # payment txn should be from auth
        purchase_txn.sender() == offer_auth_addr,
        # transfer amount <= offered amount
        asset_amt <= offer_amt,
        # Passed the correct account according to the policy
        Or(
            And(
                purchase_txn.type_enum() == TxnType.AssetTransfer,
                # Just to be sure
                purchase_txn.asset_close_to() == Global.zero_address(),
                # Make sure payments go to the right participants
                purchase_txn.asset_receiver() == Global.current_application_address(),
            ),
            And(
                purchase_txn.type_enum() == TxnType.Payment,
                # Just to be sure
                purchase_txn.close_remainder_to() == Global.zero_address(),
                # Make sure payments are going to the right participants
                purchase_txn.receiver() == Global.current_application_address(),
            ),
        ),
        royalty_acct == stored_royalty_recv.load(),
    )

    return Seq(
        # initialize values to check rekey
        (owner_auth := AccountParam.authAddr(owner_acct)),
        (buyer_auth := AccountParam.authAddr(buyer_acct)),
        # Make sure neither owner/buyer have been rekeyed (OPTIONAL)
        Assert(owner_auth.value() == Global.zero_address()),
        Assert(buyer_auth.value() == Global.zero_address()),
        # Grab the royalty policy settings
        stored_royalty_recv.store(royalty_receiver()),
        stored_royalty_basis.store(royalty_basis()),
        # Make sure transactions look right
        Assert(valid_transfer_group),
        # Make sure all txn fees are covered (move asset + two payment txns)
        Assert(Txn.fee() >= Int(4000)),
        # Make royalty payment
        If(
            purchase_txn.type_enum() == TxnType.AssetTransfer,
            pay_assets(
                purchase_txn.xfer_asset(),
                purchase_txn.asset_amount(),
                owner_acct,
                royalty_acct,
                stored_royalty_basis.load(),
            ),
            pay_algos(
                purchase_txn.amount(),
                owner_acct,
                royalty_acct,
                stored_royalty_basis.load(),
            ),
        ),
        # Perform asset move
        move_asset(asset_id, owner_acct, buyer_acct, asset_amt),
        # Clear listing from local state of owner
        update_offered(
            owner_acct,
            Itob(asset_id),
            offer_auth_addr,
            offer_amt - asset_amt,
            Txn.sender(),
            curr_offered_amt,
        ),
        Int(1),
    )


@Subroutine(TealType.uint64)
def royalty_free_move():
    asset_id = Txn.assets[Btoi(Txn.application_args[1])]
    asset_amt = Btoi(Txn.application_args[2])

    from_acct = Txn.accounts[Btoi(Txn.application_args[3])]
    to_acct = Txn.accounts[Btoi(Txn.application_args[4])]

    prev_offered_amt = Btoi(Txn.application_args[5])
    prev_offered_auth = Txn.sender()

    offer = App.localGet(from_acct, Itob(asset_id))

    curr_offer_amt = ScratchVar()
    curr_offer_auth = ScratchVar()
    return Seq(
        curr_offer_amt.store(offered_amount(offer)),
        curr_offer_auth.store(offered_auth(offer)),
        # Must match what is currently offered
        Assert(curr_offer_amt.load() == prev_offered_amt),
        Assert(curr_offer_auth.load() == prev_offered_auth),
        # Must be set to app creator and less than the amount to move
        Assert(curr_offer_auth.load() == administrator()),
        Assert(curr_offer_amt.load() <= asset_amt),
        # Txn fee must cover the cost of the move
        Assert(Txn.fee() >= Int(2000)),
        # Delete the offer
        update_offered(
            from_acct,
            Itob(asset_id),
            Bytes(""),
            Int(0),
            prev_offered_auth,
            prev_offered_amt,
        ),
        # Move it
        move_asset(asset_id, from_acct, to_acct, asset_amt),
        Int(1),
    )

#endregion


def approval():
    from_administrator = Txn.sender() == administrator()

    action_router = Cond(
        [
            And(Txn.application_args[0] == Selectors.royalty_free_move, from_administrator),
            royalty_free_move(),
        ],
        [
            And(Txn.application_args[0] == Selectors.set_policy, from_administrator),
            set_policy(),
        ],
        [
            And(Txn.application_args[0] == Selectors.set_payment_asset, from_administrator),
            set_payment_asset(),
        ],
        [
            And(Txn.application_args[0] == Selectors.set_administrator, from_administrator),
            set_administrator(),
        ],
        [Txn.application_args[0] == Selectors.transfer, transfer()],
        [Txn.application_args[0] == Selectors.offer, offer()],
        [Txn.application_args[0] == Selectors.get_offer, get_offer()],
        [Txn.application_args[0] == Selectors.get_policy, get_policy()],
        [Txn.application_args[0] == Selectors.get_administrator, get_administrator()],
    )

    return Cond(
        [Txn.application_id() == Int(0), Return(put_administrator(Txn.sender()))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(from_administrator)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(from_administrator)],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.NoOp, Return(action_router)],
    )


def compile_enforcer_approval():
    return compileTeal(
        approval(),
        mode=Mode.Application,
        version=6,
        optimize=OptimizeOptions(scratch_slots=True),
    )


if __name__ == "__main__":
    print(compile_enforcer_approval())
