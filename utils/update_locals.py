import json
import os
import sys
from collections import OrderedDict

# 定义相对于脚本位置的本地化目录路径
script_dir = os.path.dirname(os.path.abspath(__file__))
locals_dir = os.path.join(os.path.dirname(script_dir), 'locals')
en_file_path = os.path.join(locals_dir, 'en.json')

def update_locale_file(lang_code):
    target_file_path = os.path.join(locals_dir, f'{lang_code}.json')

    print(f"处理语言: {lang_code}")
    print(f"英文文件: {en_file_path}")
    print(f"目标文件: {target_file_path}")

    # 读取英文本地化文件（参考）
    try:
        with open(en_file_path, 'r', encoding='utf-8') as f:
            # 使用OrderedDict以保留en.json中的键顺序
            en_data = json.load(f, object_pairs_hook=OrderedDict)
        print(f"成功读取 {len(en_data)} 个键从 en.json")
    except FileNotFoundError:
        print(f"错误: 未找到英文本地化文件在 {en_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"错误解码JSON从 {en_file_path}: {e}")
        return

    # 读取目标本地化文件
    target_data = OrderedDict()
    if os.path.exists(target_file_path):
        try:
            with open(target_file_path, 'r', encoding='utf-8') as f:
                target_data = json.load(f, object_pairs_hook=OrderedDict)
            print(f"成功读取 {len(target_data)} 个键从 {lang_code}.json")
        except json.JSONDecodeError as e:
            print(f"警告: 错误解码JSON从 {target_file_path}, 从空字典开始。错误: {e}")
            target_data = OrderedDict() # 如果文件损坏则重置
        except Exception as e:
            print(f"警告: 无法读取 {target_file_path}, 从空字典开始。错误: {e}")
            target_data = OrderedDict() # 其他读取错误时重置
    else:
        print(f"警告: 未找到目标文件 {target_file_path}。创建一个新的。")

    # 创建一个新的有序字典用于更新的数据
    updated_data = OrderedDict()
    missing_keys_count = 0

    # 遍历英文键以保持顺序并添加缺失的键
    for key, en_value in en_data.items():
        if key in target_data and target_data[key]: # 保留现有的非空翻译
            updated_data[key] = target_data[key]
        else: # 添加缺失的键或用英文值填充现有的空键
            updated_data[key] = en_value
            if key not in target_data:
                missing_keys_count += 1
            elif not target_data[key]:
                 print(f"  - 键 '{key}' 存在但为空，用英文值填充。")

    # 将更新的数据写回目标文件
    try:
        with open(target_file_path, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, ensure_ascii=False, indent=2)
        print(f"成功更新 {target_file_path}。添加了 {missing_keys_count} 个缺失的键。")
        if len(updated_data) != len(en_data):
             print(f"  - 警告: 最终键数 ({len(updated_data)}) 与 en.json ({len(en_data)}) 不同。")

    except IOError as e:
        print(f"错误写入 {target_file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("用法: python update_locals.py <语言代码>")
        print("示例: python update_locals.py de")
        sys.exit(1)

    lang_code_to_update = sys.argv[1]
    supported_langs = ['de', 'es', 'fr', 'ja', 'ko', 'ru', 'zh'] # 包含'zh'以进行完整性检查

    if lang_code_to_update not in supported_langs:
         print(f"错误: 语言代码 '{lang_code_to_update}' 不支持或无效。")
         print(f"支持的代码: {', '.join(supported_langs)}")
         sys.exit(1)

    update_locale_file(lang_code_to_update)