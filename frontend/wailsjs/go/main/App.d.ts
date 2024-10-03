// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';
import {utils} from '../models';
import {crosschain} from '../models';

export function AddAsset(arg1:number,arg2:string,arg3:string,arg4:string,arg5:string):Promise<main.ChainAssets>;

export function AddCustomToken(arg1:number,arg2:string,arg3:string,arg4:string,arg5:string):Promise<main.ChainAssets>;

export function AddLedger(arg1:number,arg2:string,arg3:string):Promise<string>;

export function CalculateFee(arg1:string,arg2:string):Promise<main.FeeInfo>;

export function CheckCardConnection():Promise<boolean>;

export function CheckCardInitialized():Promise<boolean>;

export function CheckUpdates():Promise<main.SelfUpdateResponse>;

export function ClearData(arg1:number,arg2:string):Promise<void>;

export function CurrentAccount():Promise<main.CardInfo>;

export function DataMigrate():Promise<void>;

export function DoUpdate():Promise<void>;

export function EnableTestnet(arg1:boolean):Promise<void>;

export function GetAddressAndAssets(arg1:number,arg2:string):Promise<main.ChainAssets>;

export function GetAllAccounts():Promise<Array<main.CardInfo>>;

export function GetAssetPrices(arg1:number,arg2:string):Promise<main.ChainAssets>;

export function GetChainConfig(arg1:string):Promise<utils.ChainConfig>;

export function GetChainConfigs():Promise<Array<utils.ChainConfig>>;

export function GetChains(arg1:number):Promise<main.CardChainInfo>;

export function GetCredentials(arg1:number):Promise<main.CardCredential>;

export function GetCurrentVersion():Promise<string>;

export function GetTransactionHistory(arg1:string,arg2:string,arg3:number,arg4:number,arg5:boolean):Promise<main.GetTransactionHistoryResponse>;

export function GetWalletConnectProjectId():Promise<string>;

export function Initialize(arg1:string,arg2:string,arg3:number):Promise<main.InitCardResponse>;

export function Install():Promise<void>;

export function IsTestnetEnabled():Promise<boolean>;

export function LoadSecrePhrase(arg1:string,arg2:string,arg3:string):Promise<main.InitCardResponse>;

export function Pair(arg1:string,arg2:string,arg3:string,arg4:string):Promise<main.CardInfo>;

export function RemoveAsset(arg1:number,arg2:string,arg3:string,arg4:string,arg5:string):Promise<void>;

export function RemoveLedger(arg1:number,arg2:string):Promise<void>;

export function ResetCard(arg1:number,arg2:string):Promise<void>;

export function ResetWallet():Promise<void>;

export function SendTransaction(arg1:string,arg2:string,arg3:string,arg4:string,arg5:string,arg6:string,arg7:string,arg8:string,arg9:number):Promise<crosschain.TxHash>;

export function SignTypedData(arg1:string,arg2:string,arg3:string,arg4:number):Promise<string>;

export function SwitchAccount(arg1:number):Promise<main.CardInfo>;

export function Teleport(arg1:string,arg2:string,arg3:string,arg4:string,arg5:string,arg6:string,arg7:string,arg8:string,arg9:number):Promise<crosschain.TxHash>;

export function Transfer(arg1:string,arg2:string,arg3:string,arg4:string,arg5:string,arg6:string,arg7:string,arg8:string,arg9:number):Promise<crosschain.TxHash>;

export function UpdateAccountName(arg1:number,arg2:string):Promise<void>;

export function VerifyAddress(arg1:number,arg2:string,arg3:string):Promise<string>;
