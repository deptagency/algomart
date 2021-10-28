import algosdk from 'algosdk'

const account = algosdk.generateAccount()
const mnemonic = algosdk.secretKeyToMnemonic(account.sk)

console.log(`Address:\n${account.addr}`)
console.log(`\nMnemonic:\n${mnemonic}`)
