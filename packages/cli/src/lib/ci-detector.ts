/**
 * CI/CD 環境を検出するユーティリティ
 * safe mode の自動有効化に使用する
 */

/**
 * 現在の環境が CI/CD 環境かどうかを判定する
 * 主要な CI サービスの環境変数を確認する
 */
export function isCIEnvironment(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.JENKINS_URL ||
    process.env.BITBUCKET_PIPELINE_UUID ||
    process.env.TF_BUILD // Azure Pipelines
  );
}
