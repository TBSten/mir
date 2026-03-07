# Changelog

すべての注目すべき変更はこのファイルに記録されます。

## [0.0.1-alpha02] - 2026-03-08

### Added
- パッケージ名を @tbsten/mir-* に統一
- 全パッケージに README を追加
- package.json に homepage, repository, bugs フィールドを追加
- MIT LICENSE ファイルを追加
- CHANGELOG.md を追加

### Changed
- @tbsten/core → @tbsten/mir-core にリネーム
- @tbsten/registry-sdk → @tbsten/mir-registry-sdk にリネーム
- @tbsten/mir の依存関係を更新

### Fixed
- publishConfig を追加（npm public access）

## [0.0.1-alpha01] - 2026-03-07

### Added
- npm packages: @tbsten/core, @tbsten/registry-sdk, @tbsten/mir (CLI)
- Official Registry (HonoX + Cloudflare Pages)
- CLI commands: init, list, info, create, publish, install, sync
- Handlebars テンプレートエンジン
- i18n サポート（日本語・英語）
- リモート Registry API
- バッチインストール機能
- インタラクティブおよび非対話モード

### Features
- **CLI**: スニペット配布・取得ツール
- **Registry SDK**: Hono ベースの REST API SDK
- **Core**: テンプレート、スキーマ、バリデーション、i18n
- **Official Registry**: Web UI + REST API

### Known Limitations
- バージョニング未実装
- 人気度表示機能未実装
- ページネーション未実装
- fork/clone 機能未実装
