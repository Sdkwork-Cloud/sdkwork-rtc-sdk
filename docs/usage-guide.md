# SDKWork RTC SDK 使用文档

本文档面向 `sdkwork-rtc-sdk` 的接入方，说明当前落地状态、默认提供商、语言支持范围、快速使用方式，以及 `volcengine` 的标准接入方式。

## 1. SDK 定位

`sdkwork-rtc-sdk` 不是某一家 RTC 厂商 SDK 的二次实现，也不会把各家媒体引擎直接打包进来。

它的职责是：

- 统一 RTC 提供商标准
- 提供类似 JDBC 的 `DriverManager` / `DataSource` / `Client` 适配模型
- 统一 provider 选择、能力协商、错误语义、插件装载和扩展点
- 让业务侧以同一套标准接入不同 RTC 厂商

当前标准明确要求：

- 官方厂商 SDK 由业务侧自行提供
- `sdkwork-rtc-sdk` 负责标准层和适配层，不负责重写厂商媒体引擎
- TypeScript 可执行基线采用 `consumer-supplied` + `native-factory` + `must-not-bundle`

## 2. 当前支持的 RTC 提供商

当前官方提供商目录如下：

| providerKey | displayName | tier | builtin | 当前说明 |
| --- | --- | --- | --- | --- |
| `volcengine` | Volcengine RTC | `tier-a` | `true` | 默认提供商，TypeScript 内置基线 |
| `aliyun` | Aliyun RTC | `tier-a` | `true` | TypeScript 内置基线 |
| `tencent` | Tencent RTC | `tier-a` | `true` | TypeScript 内置基线 |
| `agora` | Agora RTC | `tier-b` | `false` | 官方目录已定义，走 package boundary |
| `zego` | ZEGO RTC | `tier-b` | `false` | 官方目录已定义，走 package boundary |
| `livekit` | LiveKit RTC | `tier-b` | `false` | 官方目录已定义，走 package boundary |
| `twilio` | Twilio Video | `tier-b` | `false` | 官方目录已定义，走 package boundary |
| `jitsi` | Jitsi Meet | `tier-b` | `false` | 官方目录已定义，走 package boundary |
| `janus` | Janus RTC | `tier-c` | `false` | 官方目录已定义，走 package boundary |
| `mediasoup` | mediasoup RTC | `tier-c` | `false` | 官方目录已定义，走 package boundary |

说明：

- `builtin = true` 的提供商目前只有 `volcengine`、`aliyun`、`tencent`
- 内置只表示它们在 TypeScript 根入口中可直接注册，不表示已内置厂商媒体运行时
- 所有提供商都遵循统一的官方目录和能力标准

## 3. 当前语言支持状态

| 语言 | 工作区 | 对外包名/入口 | 状态 | 说明 |
| --- | --- | --- | --- | --- |
| TypeScript | `sdkwork-rtc-sdk-typescript` | `@sdkwork/rtc-sdk` | `reference` | 当前唯一可执行参考实现 |
| Flutter | `sdkwork-rtc-sdk-flutter` | `rtc_sdk` | `reserved` | 已落标准骨架和默认 provider 规则，尚未落真实 runtime bridge |
| Java | `sdkwork-rtc-sdk-java` | `com.sdkwork.rtc` | `reserved` | 标准骨架 |
| Kotlin | `sdkwork-rtc-sdk-kotlin` | `com.sdkwork.rtc` | `reserved` | 标准骨架 |
| Go | `sdkwork-rtc-sdk-go` | `rtcstandard` | `reserved` | 标准骨架 |
| C# | `sdkwork-rtc-sdk-csharp` | `Sdkwork.Rtc` | `reserved` | 标准骨架 |
| Swift | `sdkwork-rtc-sdk-swift` | `RtcSdk` | `reserved` | 标准骨架 |
| Rust | `sdkwork-rtc-sdk-rust` | `sdkwork_rtc_sdk` | `reserved` | 标准骨架 |
| Python | `sdkwork-rtc-sdk-python` | `sdkwork_rtc_sdk` | `reserved` | 标准骨架 |

结论：

- 当前真正可以快速运行标准能力的是 TypeScript 基线
- Flutter 已经默认走 `volcengine` 选择规则，但还不是完整媒体运行时接入
- 其他语言当前以标准化骨架、元数据目录、选择规则、装载边界为主

## 4. 默认提供商约定

当前默认提供商固定为 `volcengine`。

TypeScript 默认常量：

- `DEFAULT_RTC_PROVIDER_KEY = 'volcengine'`
- `DEFAULT_RTC_PROVIDER_PLUGIN_ID = 'rtc-volcengine'`
- `DEFAULT_RTC_PROVIDER_DRIVER_ID = 'sdkwork-rtc-driver-volcengine'`

Flutter 默认常量同样对齐 `volcengine`。

provider 选择优先级固定如下：

1. `providerUrl`
2. `providerKey`
3. `tenantOverrideProviderKey`
4. `deploymentProfileProviderKey`
5. `defaultProvider`

也就是说，在 Web 和 Flutter 场景下，如果业务方没有显式覆盖 provider，最终都会回落到 `volcengine`。

## 5. TypeScript 快速开始

### 5.1 先只跑标准层

如果你只是想确认 SDK 标准层、provider 选择和能力目录是否正常工作，可以直接使用内置 driver manager：

```ts
import {
  createBuiltinRtcDriverManager,
  RtcDataSource,
} from '@sdkwork/rtc-sdk';

const driverManager = createBuiltinRtcDriverManager();
const dataSource = new RtcDataSource({
  driverManager,
});

console.log(dataSource.describeSelection());
// { providerKey: 'volcengine', source: 'default_provider' }

console.log(dataSource.describe());
// 返回当前选中 provider 的标准元数据

console.log(dataSource.describeProviderSupport());
// 返回 provider support 状态，默认会是 volcengine -> builtin_registered

console.log(dataSource.listProviderSupport());
// 返回全部官方 provider 的 support 状态
```

这一步可以快速验证：

- 默认 provider 是否正确落到 `volcengine`
- provider catalog 是否生效
- provider selection 是否按标准优先级工作
- capability / extension / support 元数据是否可查询

### 5.2 仅创建标准 client

你也可以先创建标准 `RtcClient`，但此时如果没有注入真实 runtime bridge，调用 `join()`、`publish()` 等运行时方法会报错：

```ts
import {
  createBuiltinRtcDriverManager,
  RtcDataSource,
} from '@sdkwork/rtc-sdk';

const dataSource = new RtcDataSource({
  driverManager: createBuiltinRtcDriverManager(),
});

const client = await dataSource.createClient();

console.log(client.metadata.providerKey);
// volcengine

await client.join({
  sessionId: 'session-1',
  roomId: 'room-1',
  participantId: 'user-1',
});
// 抛出 RtcSdkException，code = 'native_sdk_not_available'
```

这是设计上的明确行为，不是 bug。

原因是：

- SDK 标准层已经准备好了
- 默认驱动也已经注册好了
- 但真实厂商 SDK 实例和运行时桥接逻辑仍然需要业务方提供

## 6. Volcengine 标准接入方式

### 6.1 标准接入原则

`volcengine` 当前已经是默认 provider，并且 TypeScript 有内置适配入口：

- `createVolcengineRtcDriver()`
- `VOLCENGINE_RTC_PROVIDER_MODULE`
- `VOLCENGINE_RTC_PROVIDER_METADATA`

但当前接入模式不是“内置火山引擎 SDK”。

当前模式是：

- 业务方提供官方 Volcengine SDK
- 业务方通过 `nativeFactory` 创建原生 client
- 业务方通过 `runtimeController` 把 `join`、`leave`、`publish`、`muteAudio` 等动作桥接到官方 SDK

### 6.2 Volcengine 接入示例

```ts
import {
  RtcDataSource,
  RtcDriverManager,
  createVolcengineRtcDriver,
} from '@sdkwork/rtc-sdk';

type VolcengineNativeClient = {
  joinRoom: (options: unknown) => Promise<void>;
  leaveRoom: () => Promise<void>;
  publishTrack: (options: unknown) => Promise<void>;
  unpublishTrack: (trackId: string) => Promise<void>;
  muteLocalAudio: (muted: boolean) => Promise<void>;
  muteLocalVideo: (muted: boolean) => Promise<void>;
};

function createYourVolcengineNativeClient(config: Record<string, unknown>): VolcengineNativeClient {
  // 这里替换成你自己的火山引擎官方 Web SDK / Flutter bridge / Electron bridge 初始化逻辑
  // sdkwork-rtc-sdk 不内置 vendor runtime
  return {
    async joinRoom() {},
    async leaveRoom() {},
    async publishTrack() {},
    async unpublishTrack() {},
    async muteLocalAudio() {},
    async muteLocalVideo() {},
  };
}

const driverManager = new RtcDriverManager({
  drivers: [
    createVolcengineRtcDriver<VolcengineNativeClient>({
      nativeFactory: async (config) => {
        return createYourVolcengineNativeClient({
          providerKey: config.providerKey,
          nativeConfig: config.nativeConfig ?? {},
        });
      },
      runtimeController: {
        async join(options, context) {
          await context.nativeClient.joinRoom(options);
          return {
            sessionId: options.sessionId,
            roomId: options.roomId,
            participantId: options.participantId,
            providerKey: context.metadata.providerKey,
            connectionState: 'joined',
          };
        },
        async leave(context) {
          await context.nativeClient.leaveRoom();
          return {
            sessionId: '',
            roomId: '',
            participantId: '',
            providerKey: context.metadata.providerKey,
            connectionState: 'left',
          };
        },
        async publish(options, context) {
          await context.nativeClient.publishTrack(options);
          return {
            trackId: options.trackId,
            kind: options.kind,
            muted: false,
          };
        },
        async unpublish(trackId, context) {
          await context.nativeClient.unpublishTrack(trackId);
        },
        async muteAudio(muted, context) {
          await context.nativeClient.muteLocalAudio(muted);
          return {
            kind: 'audio',
            muted,
          };
        },
        async muteVideo(muted, context) {
          await context.nativeClient.muteLocalVideo(muted);
          return {
            kind: 'video',
            muted,
          };
        },
      },
    }),
  ],
});

const dataSource = new RtcDataSource({
  driverManager,
  nativeConfig: {
    appId: 'your-volcengine-app-id',
  },
});

const client = await dataSource.createClient();

await client.join({
  sessionId: 'session-1',
  roomId: 'room-1',
  participantId: 'user-1',
  token: 'your-token',
});
```

这个示例体现的是标准接入边界：

- `sdkwork-rtc-sdk` 负责统一标准
- Volcengine 官方 SDK 负责真实 RTC 媒体能力
- 业务方只需要把厂商 SDK 映射到统一 runtime surface

## 7. 切换提供商的方式

### 7.1 通过 `providerKey`

```ts
const dataSource = new RtcDataSource({
  driverManager: createBuiltinRtcDriverManager(),
  providerKey: 'tencent',
});

console.log(dataSource.describeSelection());
// { providerKey: 'tencent', source: 'provider_key' }
```

### 7.2 通过 `providerUrl`

```ts
const dataSource = new RtcDataSource({
  driverManager: createBuiltinRtcDriverManager(),
  providerUrl: 'rtc:aliyun://cluster/prod',
});

console.log(dataSource.describeSelection());
// { providerKey: 'aliyun', source: 'provider_url' }
```

### 7.3 通过租户覆盖或部署配置覆盖

```ts
const dataSource = new RtcDataSource({
  driverManager: createBuiltinRtcDriverManager(),
  tenantOverrideProviderKey: 'tencent',
});

console.log(dataSource.describeSelection());
// { providerKey: 'tencent', source: 'tenant_override' }
```

## 8. 非内置提供商的装载方式

对于 `agora`、`zego`、`livekit`、`twilio`、`jitsi`、`janus`、`mediasoup` 这类非内置提供商，标准做法是通过 provider package boundary 装载，而不是直接深度耦合到根入口。

示例：

```ts
import {
  RtcDriverManager,
  createRtcProviderPackageLoader,
  installRtcProviderPackage,
} from '@sdkwork/rtc-sdk';

const manager = new RtcDriverManager();
const loader = createRtcProviderPackageLoader();

await installRtcProviderPackage(
  manager,
  {
    providerKey: 'agora',
    options: {
      nativeFactory: async (config) => {
        return createYourAgoraNativeClient(config);
      },
      runtimeController: createYourAgoraRuntimeController(),
    },
  },
  loader,
);
```

前提是：

- 对应 provider package 已经安装到运行环境
- 业务方已经准备好官方厂商 SDK
- 业务方已经实现 runtime bridge

## 9. Flutter 当前可用范围

Flutter 当前已经落了以下标准能力：

- `RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY` 默认指向 `volcengine`
- `resolveRtcProviderSelection()` 按统一优先级解析 provider
- `RtcDataSource.describeSelection()` 和 `RtcDataSource.describeProviderSupport()` 可用于元数据层验证
- Flutter 根入口为 `lib/rtc_sdk.dart`

示例：

```dart
import 'package:rtc_sdk/rtc_sdk.dart';

const dataSource = RtcDataSource();
final selection = dataSource.describeSelection();

print(selection.providerKey);
// volcengine
```

但是当前 Flutter 还没有真实 runtime bridge，因此现阶段它的定位是：

- 默认 provider 规则已就位
- 元数据层和标准层已就位
- 真实媒体能力接入仍需后续补 runtime bridge

## 10. 错误语义

当前必须关注的标准错误码如下：

- `invalid_provider_url`
- `driver_not_found`
- `provider_not_supported`
- `provider_package_not_found`
- `provider_package_load_failed`
- `provider_module_export_missing`
- `provider_metadata_mismatch`
- `native_sdk_not_available`
- `vendor_error`

其中最重要的两个：

- `provider_not_supported`：官方目录中存在该 provider，但当前运行时没有注册对应 driver
- `native_sdk_not_available`：已经拿到标准 client，但没有实际 runtime bridge 可执行

## 11. 本地验证命令

在当前仓库中，建议使用以下命令验证：

```powershell
node .\bin\materialize-sdk.mjs
node .\bin\verify-sdk.mjs
node .\sdkwork-rtc-sdk-typescript\bin\package-task.mjs test
node .\bin\smoke-sdk.mjs
```

说明：

- `materialize-sdk.mjs` 用于把模板和 assembly 物化为标准产物
- `verify-sdk.mjs` 用于校验标准契约和生成结果
- `package-task.mjs test` 用于校验 TypeScript 可执行基线
- `smoke-sdk.mjs` 是仓库级回归入口

## 12. 当前阶段的正确认知

如果你的目标是“马上把 RTC 标准层跑起来”，当前答案是：

- 可以，TypeScript 已经可以快速跑通标准层、默认 provider 选择、driver manager、data source、capability/support 查询

如果你的目标是“零配置直接跑通真实 Volcengine 音视频会话”，当前答案是：

- 还不行
- 需要业务方补上官方 Volcengine SDK 实例创建和 runtime bridge

如果你的目标是“Flutter 默认走 volcengine 并保持标准一致”，当前答案是：

- 已经做到默认 provider 对齐 `volcengine`
- 但真实 Flutter runtime bridge 还没有落地

这正是当前 `sdkwork-rtc-sdk` 的设计边界，也是为了保证标准化、可插拔、无厂商 runtime 技术债的核心取舍。
