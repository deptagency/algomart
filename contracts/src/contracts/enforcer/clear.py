from pyteal import Approve, Mode, compileTeal


def enforcer_clear():
    return Approve()


def compile_enforcer_clear():
    return compileTeal(
        enforcer_clear(),
        mode=Mode.Application,
        version=6,
    )


if __name__ == "__main__":
    print(compile_enforcer_clear())
