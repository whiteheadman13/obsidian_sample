import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
//import { SampleSettingTab } from "./settings";

interface MyPluginSettings {
	paths: string[];
}

interface FileAlias {
    filename: string;
    aliases: string[];
}

//Create a settings definition
const DEFAULT_SETTINGS: MyPluginSettings = {
	paths: [],
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	//Save and load the settings object
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		//設定をロード
        await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MyPluginSettingTab(this.app, this));

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new SampleModal(this.app).testMethod(this.settings);
			//new Notice('This is a notice!');
		});

		/**
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('追加テスト');
 		*/

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'setFileLink',
			name: 'setFileLink',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						console.log('処理開始 setFileLinkを起動します');
						new SampleModal(this.app).setFileLink(this.settings);
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});


		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}
	
	
}

interface FileAlias {
	filename: string;
	aliases: string[];
  }

class SampleModal extends Modal {
	fileAlias: FileAlias;
	constructor(app: App) {
		super(app);
		this.fileAlias = this.fileAlias;

	}
	/** テストメソッド
	async testMethod(settings: MyPluginSettings) {
        
		if (!settings || !settings.paths) {
			console.error('settingsまたはpathsが未定義です。');
			return;
		}

		// ユーザーが設定したパスを利用した処理
        settings.paths.forEach(async (path) => {
            // 例: パスが有効か確認し、何らかの処理を行う
            const pathIsValid = await this.isValidPathInVault(this.app, path);
            if (pathIsValid) {
                // パスが有効な場合の処理
                console.log(`Processing path: ${path}`);
                // ここに具体的な処理を追加
            } else {
                // パスが無効な場合の処理
                console.error(`Invalid path: ${path}`);
            }
        });
	}
	
	 */
	// パスがVault内に存在するかどうかを非同期でチェック
	async isValidPathInVault(app: App, path: string): Promise<boolean> {
		// Vaultのルートからの相対パスで存在チェック
		const exists = await app.vault.adapter.exists(path);
		// 存在しない場合はtrue、存在する場合はfalseを返す
		return exists;
	}


	async setFileLink(settings: MyPluginSettings) {
		//開始log出力
		console.log("setFileLinkを呼び出しました。");

			//開いているペインのパスを取得する。
			const filePath = this.getActiveFilePath();
	
			//開いているペインのTFileを取得する
			const file = this.getFileByPath(filePath);

			//開いているペインのファイルをバックアップする
			await this.createFileCopy(file);
			
			//開いているペインの内容を取得する
			const fileContent =  await app.vault.read(file);
	
			//aliasの一覧を取得
			const fileAliases = await this.loadFilesAndAliases(settings);
			console.log('fileAliases' + fileAliases);

			//ファイルの内容を置き換え、リンクを設定する
			const updatedContent = this.replaceContentWithLinksExcludingYAML(fileContent, fileAliases);
			console.log('置き換えました');

			//開いているペインの内容をアップデートする
			await app.vault.modify(file, updatedContent);

			const {contentEl} = this;
			contentEl.setText('処理が完了しました');
	
	

	}

	//ファイルエイリアスを取得する
	async loadFilesAndAliases(settings: MyPluginSettings): Promise<FileAlias[]> 
	{
		console.log('loadFilesAndAliasesが呼び出されました');
		
		if (!settings || !settings.paths) {
			console.error('settingsまたはpathsが未定義です。設定画面から設定をお願いします');
			return;
		}

		let fileReadPromises: Promise<FileAlias>[] = [];

		//設定情報を読み込みループを行います。
		// ユーザーが設定したパスを利用した処理
        await settings.paths.forEach(async (path) => {
            // 例: パスが有効か確認し、何らかの処理を行う
            const pathIsValid = await this.isValidPathInVault(this.app, path);
            if (pathIsValid) {
                // パスが有効な場合、処理を継続
				console.log(path + 'フォルダのエイリアスを取得します');

				const targetFolderPath: string = path;
			
				// 特定のフォルダ配下のファイル一覧を取得
				await this.app.vault.getFiles().forEach((file: TFile) => {
				if (file.path.startsWith(targetFolderPath)) {

					//ファイルのエイリアスをリストに保存
					const promise =  this.app.vault.read(file).then(async (content: string): Promise<FileAlias> => {
						const aliases = await this.extractAliases(content); // 仮にエイリアスを抽出する関数が存在すると仮定
						
						return { filename: file.basename, aliases };
					});
					fileReadPromises.push(promise);
				}
				});
				


				
            } else {
                // パスが無効な場合の処理
                console.error(`Invalid path: ${path}`);
            }
        });

		console.log('fileReadPromises:' + fileReadPromises);
		// Promise.allを使用してすべてのPromiseが解決するのを待ち、結果の配列を返す
		return Promise.all(fileReadPromises).then((fileAliases) => {
			
			// ファイル名が長い順にソートしてコンソールに出力
			fileAliases
				.flatMap(item => {
					// ファイル名自体もエイリアスリストに追加
					const aliasesWithFilename = [...item.aliases, item.filename];
					return aliasesWithFilename.map(alias => ({ filename: item.filename, alias }));
    			})
				.sort((a, b) => b.filename.length - a.filename.length);
			
			// ファイル名が長い順にソート
			return fileAliases.sort((a, b) => b.filename.length - a.filename.length);

		});

	}
	
	
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	async mdFileCopy(){
		//この関数を呼び出して、アクティブなペインに開かれているファイルのパスを取得
		const filePath = await this.getActiveFilePath();
		console.log("ファイルパスは、" + filePath);
		const file = this.getFileByPath(filePath);
		if (file) {
			console.log("ファイル名:", file.name);
			if (file instanceof TFile) {
				this.createFileCopy(file).then(() => console.log("コピー完了")).catch(console.error);
			} else {
				console.log("指定されたパスにファイルが見つかりません。");
			}
		} else {
			console.log("ファイルが見つかりませんでした。");
		}

	}


	async extractAliases(fileContent: string): Promise<string[]> {
		
		console.log("extractAliasesが呼び出されました");
		// YAMLブロック内のエイリアスを検出するための正規表現パターンをさらに更新
		const yamlPattern = /^aliases:(.*?$(?:\n  - .*)*|.*?(\[.*?\])?.*?)/ms;
		const match = fileContent.match(yamlPattern);
	
		if (match) {
			// インデントされたリスト形式
			if (match[1] && match[1].includes('\n  - ')) {
				const listStyleAliases = match[1].split('\n').filter(line => line.startsWith('  - ')).map(line => line.replace('  - ', '').trim().replace(/^["']|["']$/g, ''));
				console.log(listStyleAliases);
				return listStyleAliases;
			} else {
				// カンマ区切り形式 (括弧がある場合もない場合も対応)
				const inlineAliases = match[1].trim();
				const aliases = inlineAliases.startsWith('[') ? inlineAliases.slice(1, -1) : inlineAliases; // 括弧を除去
				return aliases.split(',').map(alias => alias.trim().replace(/^["']|["']$/g, ''));
			}
		}
		
		return [];
	}

	replaceContentWithLinksExcludingYAML(content: string, fileAliases: FileAlias) {
		// YAML領域を特定する正規表現パターン
		const yamlPattern = /^---[\s\S]+?---\n/;
		let yamlContent = '';
		let yamlMatch = content.match(yamlPattern);
	
		// YAML領域が存在する場合、一時的に取り除く
		if (yamlMatch) {
			yamlContent = yamlMatch[0];
			content = content.replace(yamlPattern, '');
		}
	
		// 以前説明したリンク置換処理を実行
		content = this.replaceContentWithLinks(content, fileAliases);
	
		// コンテンツの最上部にYAML領域を戻す
		content = yamlContent + content;
		return content;
	}

	replaceContentWithLinks(content: string, fileAliases: FileAlias) {
		fileAliases.forEach(({ filename, aliases }) => {
			// filenameに対する置換
			if (!content.match(new RegExp(`\\[\\[${filename}\\]\\]`))) { // 既に[[filename]]で囲われていない場合
				const regexFilename = new RegExp(`(?<!\\[\\[)${filename}(?!\\]\\])`, 'g');
				content = content.replace(regexFilename, `[[${filename}]]`);
			}
	
			// aliasesに対する置換
			aliases.forEach(alias => {
				if (!content.match(new RegExp(`\\[\\[.*\\|${alias}\\]\\]`))) { // 既に[[filename|alias]]で囲われていない場合
					const regexAlias = new RegExp(`(?<!\\[\\[.*\\|)${alias}(?!\\]\\])`, 'g');
					content = content.replace(regexAlias, `[[${filename}|${alias}]]`);
				}
			});
		});
		return content;
	}
	
	// アクティブなペインに開かれているファイルのファイルパスを取得する関数
	getActiveFilePath() {
		// アクティブなリーフ（ペイン）を取得
		const activeLeaf = app.workspace.activeLeaf;
		if (!activeLeaf) {
			console.log("アクティブなペインがありません。");
			return null;
		}

		// リーフから現在のビューを取得
		const view = activeLeaf.view;

		// ビューがマークダウンファイルのビューであるか確認し、ファイルパスを取得
		if (view.getViewType() === "markdown") {
			// ビューからファイル情報を取得する前に、fileプロパティが存在するか確認
			if (view.file) {
				// ファイルパスを取得して返す
				return view.file.path;
			} else {
				console.log("このビューにはファイル情報が含まれていません。");
				return null;
			}
		} else {
			console.log("アクティブなペインにマークダウンファイルが開かれていません。");
			return null;
		}

	}

	// ファイルパスからTFileオブジェクトを取得する関数
    getFileByPath(filePath :string) {
    // Vaultからファイル（またはフォルダ）を取得
    const file = app.vault.getAbstractFileByPath(filePath);

    // 取得したオブジェクトがTFileインスタンスであるか確認
    if (file instanceof TFile) {
        // TFileオブジェクトであればそれを返す
        return file;
    } else {
        // TFileオブジェクトでなければ、nullを返すか、エラーメッセージを表示
        console.error("指定されたパスにファイルが存在しません。");
        return null;
    }
}


	// TFileオブジェクトを引数に取り、そのファイルのコピーを作成する関数
	async createFileCopy(originalFile :TFile) {
		try {
			// 元のファイルの内容を読み込む
			const fileContent = await app.vault.read(originalFile);

			// 新しいファイル名を決定（例: original.md -> original_copy.md）
			const originalFileName = originalFile.name;
			const fileNameParts = originalFileName.split('.');
			const fileExtension = fileNameParts.pop();
			const newFileName = `${fileNameParts.join('.')}_copy.${fileExtension}`;

			// 元のファイルと同じディレクトリに新しいファイル名でファイルを作成
			const newFilePath = originalFile.path.replace(originalFileName, newFileName);
			
			await app.vault.create(newFilePath, fileContent);
			console.log(`ファイルがコピーされました: ${newFilePath}`);
		} catch (error) {
			console.error(`ファイルのコピーに失敗しました: ${error}`);
		}
	}

}


export class MyPluginSettingTab  extends PluginSettingTab {
	plugin: MyPlugin;
	settings: MyPluginSettings;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async onload() {
        await this.loadSettings();
        this.addSettingTab(new MyPluginSettingTab(this.app, this));
    }
	
	addSettingTab(arg0: MyPluginSettingTab) {
		throw new Error('Method not implemented.');
	}

	async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.createEl('h2', {text: 'パス設定'});

		this.plugin.settings.paths.forEach((path, index) => {
            this.createPathSetting(containerEl, path, index);
        });

        new Setting(containerEl)
            .addButton(btn => btn
                .setButtonText('追加')
                .onClick(() => {
                    this.plugin.settings.paths.push('');
                    this.plugin.saveSettings().then(() => this.display());
                }));
	}

	createPathSetting(containerEl: HTMLElement, path: string, index: number) {
        const setting = new Setting(containerEl)
        .addText(text => text
            .setValue(path)
            .onChange(async (value) => {
                const errorMessageElId = `path-error-${index}`;
                let errorMessageEl = document.getElementById(errorMessageElId);

                // エラーメッセージ要素がまだなければ作成
                if (!errorMessageEl) {	
                    errorMessageEl = document.createElement('div');
                    errorMessageEl.id = errorMessageElId;
                    errorMessageEl.style.color = 'red';
                    text.inputEl.parentElement.appendChild(errorMessageEl);
                }

				// Vault内にパスが存在しないことを確認
				const pathIsValid = await this.isValidPathInVault(this.app, value);


				if (pathIsValid) {
					// 有効な場合、エラーメッセージをクリアして設定を更新
					errorMessageEl.textContent = ""; 
					this.plugin.settings.paths[index] = value;
					await this.plugin.saveSettings();
				} else {
					errorMessageEl.textContent = "このパスはVault内に存在しません。";
				}
				}));

        setting.addButton(btn => btn
            .setButtonText('削除')
            .onClick(async () => {
                this.plugin.settings.paths.splice(index, 1);
                await this.plugin.saveSettings();
                this.display(); // 設定画面を再描画
            }));
    }

	// パスが有効かどうかを検証する簡単な例（実際の要件に合わせて調整）
	isValidPath(path: string): boolean {
		// ここでは単純に空でないことをチェック（実際にはより複雑な検証が必要かもしれません）
		return path.trim() !== '';
	}

	// パスが一意かどうかをチェック
	isUniquePath(paths: string[], newPath: string, currentIndex: number): boolean {
		return !paths.some((path, index) => path === newPath && index !== currentIndex);
	}

	// パスがVault内に存在するかどうかを非同期でチェック
	async isValidPathInVault(app: App, path: string): Promise<boolean> {
    // Vaultのルートからの相対パスで存在チェック
    const exists = await app.vault.adapter.exists(path);
    // 存在する場合はtrue、存在する場合はfalseを返す
    return exists;
}


}
