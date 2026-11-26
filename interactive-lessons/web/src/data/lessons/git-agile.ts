import type { Lesson } from "../types";

// Git for juniors plus branching workflow and Agile basics. Every git command and output quoted in the boards was run in a
// throwaway repo with git 2.39.5 (graphs, conflict markers, reset modes, reflog, cherry-pick release). The feature-flag
// snippet is a sketch and was not run.
export const gitAgile: Lesson = {
  slug: "git-agile",
  crumb: "Git và quy trình làm việc",
  videoDir: "/videos/git-agile",
  videoVersion: "0",
  scenes: [],
  title: "Git và quy trình làm việc: từ commit đến release",
  subtitle:
    "Mô hình trong đầu của Git, làm việc nhóm với branch và pull request, merge hay rebase hay squash, xử lý conflict, undo an toàn với restore, revert, reset và reflog, Git flow, GitHub flow, trunk-based, bài toán chỉ đẩy đúng một tính năng lên production, và Agile so với waterfall.",
  openingQuiz: {
    question: "Em lỡ chạy `git reset --hard HEAD~2` và mất hai commit chưa push. Có lấy lại được không?",
    options: [
      "Không, reset --hard xoá vĩnh viễn",
      "Được, nhìn `git reflog` để tìm hash cũ rồi `git reset --hard` về đó",
      "Chỉ được nếu đã push lên remote",
      "Phải clone lại repo",
    ],
    answer: 1,
    explain:
      "Hai commit chỉ không còn được nhánh trỏ tới, dữ liệu vẫn nằm trong repo. Reflog ghi lại mọi lần HEAD di chuyển nên tìm được hash cũ. Thứ không cứu được là thay đổi chưa commit bị reset --hard xoá khỏi working tree.",
  },
  roadmap: [
    "Chặng 1: mô hình trong đầu (working tree, staging, commit, branch, HEAD), làm việc nhóm với branch và pull request, merge hay rebase hay squash.",
    "Chặng 2: đọc và giải quyết conflict, undo an toàn (restore, revert, reset, reflog), và quy tắc không rebase nhánh đã chia sẻ.",
    "Chặng 3: Git flow, GitHub flow, trunk-based, bài toán chỉ lên một tính năng, feature flag, CI/CD, rollback, Agile so với waterfall.",
  ],
  sections: [
    {
      id: "git-mental-model",
      title: "Phần 1: Mô hình trong đầu của Git",
      intro: [
        "Phần lớn người mới sợ Git vì nhớ lệnh mà không hình dung được lệnh đang làm gì. Chỉ cần nắm bốn khái niệm là hầu hết lệnh trở nên dễ đoán.",
        "Một file trong dự án nằm ở ba nơi, và mỗi lệnh chỉ chuyển nó từ nơi này sang nơi kia:",
        "- **Working tree**: các file thật trên đĩa, nơi em đang sửa.",
        "- **Staging area (index)**: danh sách thay đổi em đã chọn để đưa vào commit kế tiếp. `git add` đưa thay đổi vào đây.",
        "- **Repository**: lịch sử các commit. `git commit` chụp staging area thành một commit mới.",
        "**Commit** là một bản chụp toàn bộ dự án, kèm tác giả, thời gian, lời nhắn và con trỏ tới commit cha. Các commit nối nhau thành một chuỗi (thực ra là đồ thị).",
        "**Branch** không phải một bản sao code. Nó chỉ là một **con trỏ có tên** trỏ vào một commit, nên tạo branch gần như tức thì và rẻ. Khi em commit, con trỏ của branch hiện tại tự dịch lên commit mới.",
        "**HEAD** là con trỏ 'em đang đứng ở đâu', thường trỏ vào một branch. `git switch` đổi HEAD sang branch khác và cập nhật working tree cho khớp.",
        "Kết quả chạy thật (repo tạm, git 2.39.5): sau khi sửa file thì trạng thái là ` M` (sửa, chưa stage), sau `git add` là `M ` (đã stage), sau `git commit` thì sạch. Tạo branch `feature/login` chỉ thêm một cái tên trỏ vào cùng commit.",
      ],
      board: {
        title: "Ba nơi và hai con trỏ",
        highlight: "con trỏ",
        chips: ["working tree", "staging", "commit", "branch", "HEAD"],
        cards: [
          {
            title: "Đường đi của một thay đổi",
            diagram: {
              kind: "flow",
              steps: ["Sửa file (working tree)", "git add (staging area)", "git commit (repository)", "git push (remote)"],
              ok: ["Commit xong", "Branch tự dịch lên commit mới"],
              bad: ["Chưa add", "File sửa nhưng sẽ không vào commit"],
            },
            notes: ["Mỗi lệnh chuyển thay đổi sang nơi kế tiếp. Chưa `git add` thì commit sẽ không chứa thay đổi đó."],
            code: `$ git status -s          # sau khi sửa a.txt
 M a.txt
$ git add a.txt; git status -s
M  a.txt
$ git commit -qm "Sua a.txt"; git branch feature/login
$ git log --oneline --decorate --graph
* 6449d03 (HEAD -> main, feature/login) Sua a.txt
* 6dbae55 Them a.txt
$ git switch -q feature/login; git symbolic-ref HEAD
refs/heads/feature/login`,
            takeaway: "Branch là con trỏ, HEAD là con trỏ tới branch",
          },
        ],
        conclusion: "**Kết luận:** hiểu ba nơi và hai con trỏ thì `add`, `commit`, `switch`, `reset` đều là chuyện di chuyển thứ gì đó giữa các nơi hoặc dịch con trỏ.",
      },
      cheat: [
        { name: "git status", one: "Xem file đang ở nơi nào", say: "Em chạy git status trước tiên để biết file nào đã sửa, đã stage hay chưa theo dõi." },
        { name: "git add / commit", one: "Chọn thay đổi rồi chụp thành commit", say: "Add đưa thay đổi vào staging, commit chụp staging thành một bản ghi lịch sử, nên em có thể chia một đống sửa thành nhiều commit nhỏ có ý nghĩa." },
        { name: "git switch -c", one: "Tạo và chuyển sang branch mới", say: "Branch chỉ là con trỏ vào một commit nên tạo rất rẻ, em tạo một branch cho mỗi việc." },
        { name: "git log --oneline --graph", one: "Xem lịch sử dạng đồ thị", say: "Em dùng log graph để nhìn các branch tách và nhập ở đâu." },
      ],
      takeaway: {
        lines: [
          "Ba nơi: working tree, staging, repository. Commit là bản chụp của staging.",
          "Branch là con trỏ có tên vào một commit, HEAD chỉ em đang đứng ở đâu.",
        ],
      },
      quiz: {
        question: "Em sửa file rồi chạy `git commit -m \"fix\"` mà chưa `git add`. Điều gì xảy ra với thay đổi đó?",
        options: [
          "Vào commit vì Git tự add",
          "Không vào commit vì nó vẫn ở working tree chứ chưa ở staging (trừ khi dùng `commit -a` cho file đã được theo dõi)",
          "Bị xoá",
          "Được đẩy lên remote",
        ],
        answer: 1,
        explain: "Commit chỉ chụp staging area. Thay đổi chưa add vẫn nằm ở working tree, nguyên vẹn. `git commit -a` mới tự stage các file đã được theo dõi.",
      },
    },
    {
      id: "git-teamwork",
      title: "Phần 2: Làm việc nhóm: branch, pull request, merge, rebase, squash",
      intro: [
        "Nhóm làm việc theo một vòng quen thuộc: tạo branch từ nhánh chính, commit trên đó, push, mở **pull request (PR)**, đồng nghiệp **review**, CI chạy test, rồi nhập vào nhánh chính. Branch riêng giúp việc dở dang của em không làm hỏng code của người khác.",
        "PR tốt thì nhỏ, một mục đích, có mô tả vì sao đổi (không chỉ đổi gì) và cách kiểm tra. PR khổng lồ thì không ai review kỹ.",
        "Khi nhập branch vào nhánh chính có ba cách. Cùng một tình huống: `feature/x` có hai commit `x1`, `x2`, trong lúc đó `main` đã có thêm commit `main-moi`.",
        "- **Merge**: tạo thêm một **merge commit** có hai cha, giữ nguyên lịch sử thật và các commit của em. An toàn nhất, đồ thị có nhánh rẽ.",
        "- **Rebase**: **viết lại** hai commit của em để chúng nằm sau `main-moi`, lịch sử thành một đường thẳng. Hash của các commit đổi vì chúng là commit mới.",
        "- **Squash merge**: gộp mọi commit của branch thành **một** commit trên `main`. Lịch sử gọn, nhưng mất từng bước nhỏ.",
        "Cách chọn thường gặp: dùng rebase để cập nhật branch cá nhân với `main` trước khi mở PR, dùng squash khi nhập PR mà các commit lẻ của em chỉ là 'wip', 'sửa lỗi chính tả', dùng merge commit khi muốn giữ nguyên lịch sử của một nhánh dài có nhiều người cùng làm. Cả nhóm nên thống nhất một quy ước.",
      ],
      predict: {
        question: "Sau khi squash merge `feature/x` (2 commit) vào `main`, `git log` của main hiện gì?",
        options: [
          "Hai commit x1, x2 như cũ",
          "Một commit mới gộp cả hai, không có commit x1 và x2 riêng",
          "Một merge commit có hai cha",
          "Không đổi gì",
        ],
        answer: 1,
        explain: "Squash biến toàn bộ thay đổi của branch thành một commit duy nhất có một cha. Branch cũ vẫn còn x1, x2 nhưng main không chứa chúng.",
      },
      board: {
        title: "Merge, rebase, squash trên cùng một tình huống",
        highlight: "cùng một tình huống",
        chips: ["merge commit", "rebase", "squash"],
        cards: [
          {
            title: "Merge: giữ nhánh rẽ",
            diagram: { kind: "pipe", from: "feature/x (x1, x2)", via: "git merge --no-ff", to: "main + merge commit", skipped: ["Viết lại lịch sử"], skippedLabel: "Không làm" },
            code: `$ git merge --no-ff feature/x -m "Merge feature/x"
$ git log --oneline --graph
*   bafd535 Merge feature/x
|\\
| * e407baf x2
| * 2145bab x1
* | ba6e364 main-moi
|/
* 77c361b base`,
            takeaway: "Lịch sử thật, có nhánh rẽ",
          },
          {
            title: "Rebase: thẳng hàng, hash đổi",
            diagram: { kind: "pipe", from: "feature/x (x1, x2)", via: "git rebase main", to: "x1, x2 đặt sau main-moi", skipped: ["Merge commit"], skippedLabel: "Không có" },
            code: `$ git switch feature/x; git rebase main
Successfully rebased and updated refs/heads/feature/x.
$ git switch main; git merge --ff-only feature/x
$ git log --oneline --graph
* 53a60ec x2
* 374ea62 x1
* ba6e364 main-moi
* 77c361b base`,
            notes: ["x1, x2 trước đó có hash khác (2145bab, e407baf). Rebase tạo commit mới giống nội dung."],
            takeaway: "Đường thẳng, nhưng viết lại commit",
          },
          {
            title: "Squash: gộp thành một",
            diagram: { kind: "pipe", from: "feature/x (x1, x2)", via: "git merge --squash", to: "một commit trên main", skipped: ["Từng commit lẻ"], skippedLabel: "Không giữ" },
            code: `$ git merge --squash feature/x
Squash commit -- not updating HEAD
$ git commit -qm "Them feature x (squash)"
$ git log --oneline --graph
* 88722bd Them feature x (squash)
* 3995b83 main-moi
* 77c361b base`,
            takeaway: "Gọn, nhưng mất các bước nhỏ",
          },
        ],
        conclusion: "**Kết luận:** merge giữ sự thật, rebase làm thẳng, squash làm gọn. Không cái nào 'đúng nhất', chọn theo quy ước của nhóm và việc em cần đọc lịch sử sau này.",
      },
      drill: {
        choices: ["Merge commit", "Rebase", "Squash"],
        items: [
          { q: "Branch cá nhân của em chậm hơn main vài commit, em muốn cập nhật trước khi mở PR cho lịch sử thẳng", a: "Rebase", why: "Branch chỉ mình em dùng, chưa ai dựa vào nó, nên viết lại commit là an toàn." },
          { q: "PR có 12 commit 'wip', 'fix typo', 'sửa lại', nhóm muốn lịch sử main mỗi PR một commit", a: "Squash", why: "Các commit lẻ không có giá trị, gộp thành một commit mô tả rõ tính năng." },
          { q: "Nhánh release dài, nhiều người cùng commit, cần giữ nguyên ai đã làm gì", a: "Merge commit", why: "Không viết lại lịch sử của nhánh nhiều người dùng, merge commit giữ nguyên các commit gốc." },
        ],
        summary: "Cá nhân và chưa chia sẻ thì rebase, PR nhiều commit rác thì squash, nhánh chung thì merge.",
      },
      takeaway: {
        lines: [
          "Merge giữ lịch sử thật, rebase viết lại cho thẳng, squash gộp thành một commit.",
          "PR nhỏ, một mục đích, mô tả rõ vì sao đổi. Quy ước nhập PR là của cả nhóm.",
        ],
      },
      quiz: {
        question: "Vì sao sau `git rebase main` các commit của branch có hash khác?",
        options: [
          "Do Git lỗi",
          "Vì rebase tạo commit mới (cha khác) có cùng nội dung, nên hash đổi",
          "Vì rebase xoá commit cũ trên remote ngay",
          "Vì hash phụ thuộc tên branch",
        ],
        answer: 1,
        explain: "Hash của commit tính từ nội dung, tác giả, thời gian và cả commit cha. Đổi cha thì ra commit khác. Vì vậy rebase là 'viết lại lịch sử', không chỉ là di chuyển.",
      },
    },
    {
      id: "git-conflict",
      title: "Phần 3: Conflict: vì sao xảy ra và cách giải quyết",
      intro: [
        "Conflict không phải lỗi, mà là Git nói: 'hai người sửa **cùng một chỗ** theo hai cách, tôi không dám đoán ai đúng'. Nếu hai người sửa chỗ khác nhau của một file, Git tự gộp được và không báo gì.",
        "Ví dụ chạy thật: trong `cfg.txt` có dòng `fee=1%`. Trên `main` có người đổi thành `fee=1.5%`, trên `feature/fee` em đổi thành `fee=2%`. Khi `git merge feature/fee`, Git dừng lại và `git status` hiện `UU cfg.txt` (cả hai bên đều sửa).",
        "Trong file, Git chèn dấu hiệu:",
        "- Phần giữa `<<<<<<< HEAD` và `=======` là bản **của em đang đứng** (nhánh hiện tại, ở đây là main).",
        "- Phần giữa `=======` và `>>>>>>> feature/fee` là bản **của nhánh đang nhập vào**.",
        "Cách giải quyết, theo thứ tự: mở file, **hiểu cả hai ý định** (nói chuyện với người kia nếu cần), sửa file thành kết quả đúng và **xoá hết dấu hiệu**, chạy test, `git add` file, rồi `git commit` (với merge) hoặc `git rebase --continue` (với rebase). Muốn bỏ cuộc thì `git merge --abort` hay `git rebase --abort`, trở về trạng thái trước đó.",
        "Điểm quan trọng: giải conflict là quyết định về **nghiệp vụ**, không phải về cú pháp. Chọn bản nào, hay phối hợp cả hai, cần hiểu vì sao hai bên đổi. Giảm conflict bằng cách: branch ngắn hạn, cập nhật từ main thường xuyên, PR nhỏ, không cùng sửa một file lớn.",
      ],
      board: {
        title: "Từ lúc Git dừng đến lúc commit xong",
        highlight: "lúc Git dừng",
        chips: ["<<<<<<<", "=======", ">>>>>>>"],
        cards: [
          {
            title: "Đọc dấu conflict rồi giải quyết",
            diagram: {
              kind: "flow",
              steps: ["git merge feature/fee", "Git dừng: CONFLICT", "Mở file, đọc hai bản", "Sửa, xoá dấu hiệu, chạy test", "git add rồi git commit"],
              ok: ["Merge xong", "Có merge commit chứa quyết định của em"],
              bad: ["Muốn bỏ", "git merge --abort về trạng thái cũ"],
            },
            code: `$ git merge feature/fee
Auto-merging cfg.txt
CONFLICT (content): Merge conflict in cfg.txt
Automatic merge failed; fix conflicts and then commit the result.
$ git status -s
UU cfg.txt
$ cat cfg.txt
<<<<<<< HEAD
fee=1.5%
=======
fee=2%
>>>>>>> feature/fee
limit=1000

# em sửa file thành (chọn fee=1.5%), rồi:
$ git add cfg.txt; git commit -qm "Merge feature/fee, chon fee=1.5%"
$ git log --oneline --graph
*   33f24c4 Merge feature/fee, chon fee=1.5%
|\\
| * dc8d62d fee len 2%
* | 05e9dbb fee len 1.5%
|/
* 35b1037 cau hinh ban dau`,
            takeaway: "Hiểu ý định hai bên rồi mới chọn",
          },
        ],
        conclusion: "**Kết luận:** conflict là Git hỏi em một câu về nghiệp vụ. Trả lời xong thì add và commit, hoặc abort để làm lại.",
      },
      trap: {
        title: "Commit nhầm cả dấu conflict",
        text: "Nếu `git add` khi trong file còn `<<<<<<<` thì dấu hiệu đó đi vào commit, build hỏng hoặc config sai. Trước khi add, tìm lại các dấu `<<<<<<<`, `=======`, `>>>>>>>` và chạy test. Không chọn bừa 'giữ bản của em' cho cả file: em có thể xoá mất việc của người khác.",
      },
      takeaway: {
        lines: [
          "Conflict xảy ra khi hai bên sửa cùng một chỗ. Phần HEAD là bản của em, phần dưới là bản đang nhập.",
          "Sửa file, xoá dấu hiệu, test, add, rồi commit hoặc rebase --continue. Bí thì --abort.",
        ],
      },
      quiz: {
        question: "Trong lúc merge, đoạn giữa `<<<<<<< HEAD` và `=======` là gì?",
        options: [
          "Bản của nhánh đang được nhập vào",
          "Bản ở nhánh em đang đứng (HEAD), còn bản của nhánh được nhập nằm dưới `=======`",
          "Bản gốc trước khi ai sửa",
          "Bản đã xoá",
        ],
        answer: 1,
        explain: "Phần trên là HEAD, tức nhánh hiện tại. Phần dưới là nhánh đang merge vào. Lưu ý khi rebase thì vai trò đảo lại: HEAD là nhánh đích đã được đặt sẵn, phần dưới là commit của em đang được áp lại.",
      },
    },
    {
      id: "git-undo",
      title: "Phần 4: Undo an toàn: restore, revert, reset, reflog",
      intro: [
        "Câu hỏi quen thuộc: 'em lỡ làm sai, giờ làm sao?'. Câu trả lời phụ thuộc **sai ở đâu** (chưa commit, đã commit chưa push, hay đã push), vì mỗi lệnh động vào một phần khác nhau.",
        "- **`git restore <file>`**: bỏ thay đổi chưa commit ở working tree, đưa file về như trong staging. Thay đổi chưa commit bị bỏ là **mất thật**. `git restore --staged <file>` chỉ bỏ file khỏi staging.",
        "- **`git revert <commit>`**: tạo **commit mới** làm ngược lại commit đó. Không sửa lịch sử, nên an toàn cho nhánh đã push và chia sẻ. Revert một merge commit cần chỉ cha nào là dòng chính: `git revert -m 1 <merge>`.",
        "- **`git reset`**: **di chuyển con trỏ branch** về commit khác, tức là sửa lịch sử. Ba mức, khác nhau ở việc nó động vào staging và working tree thế nào.",
        "Ba mức của reset (chạy thật với ba commit c1, c2, c3 rồi `reset HEAD~1`, tức bỏ c3 khỏi branch):",
        "- **`--soft`**: chỉ dịch branch. Thay đổi của c3 vẫn **đã stage**. Hợp để gộp lại commit hoặc sửa lại lời nhắn.",
        "- **`--mixed`** (mặc định): dịch branch và bỏ staging. Thay đổi vẫn còn trong working tree, **chưa stage**.",
        "- **`--hard`**: dịch branch, bỏ staging và **ghi đè working tree**. File trở về như c2. Đây là mức nguy hiểm, vì thay đổi chưa commit mất vĩnh viễn.",
        "Quy tắc chọn: sai chưa commit thì restore. Sai ở commit **đã push hoặc người khác đã pull** thì **revert**. Sai ở commit local, chưa ai thấy thì reset.",
        "Nếu lỡ reset mất commit: **`git reflog`** ghi lại mọi chỗ HEAD từng đứng (mặc định giữ khoảng 90 ngày, chỉ trên máy em). Tìm hash trước khi reset rồi `git reset --hard <hash>` hoặc `git branch cuu <hash>` để cứu.",
        "**Nguyên tắc vàng**: không viết lại lịch sử (rebase, reset rồi push --force) của nhánh người khác đã lấy về. Họ có commit cũ, em đẩy commit mới, lịch sử hai bên phân kỳ và công việc có thể bị mất hoặc trùng. Nếu buộc phải đẩy sau khi rebase branch cá nhân, dùng `git push --force-with-lease` (từ chối nếu remote có commit mới em chưa thấy) thay vì `--force`.",
      ],
      board: {
        title: "Reset ba mức và cứu bằng reflog",
        highlight: "reflog",
        chips: ["soft", "mixed", "hard", "reflog"],
        cards: [
          {
            title: "Reset: cùng một lệnh, ba mức",
            diagram: {
              kind: "hub",
              inputs: [
                { label: "reset --soft", mark: "ok" },
                { label: "reset --mixed", mark: "calc" },
                { label: "reset --hard", mark: "minus" },
              ],
              center: "git reset HEAD~1",
              rulesTitle: "Sau reset, thay đổi của c3 ở đâu",
              rules: [
                "soft: đã stage (M )",
                "mixed: còn trong working tree, chưa stage ( M)",
                "hard: biến mất, file về như c2",
              ],
            },
            code: `$ git reset --soft HEAD~1      # log: c2
status: M  f      file: a b c
$ git reset --mixed HEAD~1     # log: c2
status:  M f      file: a b c
$ git reset --hard HEAD~1      # log: c2
status: (sạch)    file: a b`,
            notes: ["Mỗi dòng chạy trong một repo tạm riêng với c1, c2, c3."],
            takeaway: "Càng về hard càng mất nhiều",
          },
          {
            title: "Cứu commit bị reset --hard bằng reflog",
            diagram: {
              kind: "flow",
              steps: ["git reset --hard HEAD~2", "Mất 2 commit khỏi branch", "git reflog tìm hash cũ", "git reset --hard HEAD@{1}"],
              ok: ["Cứu được", "Commit trở lại, file về như cũ"],
              bad: ["Không cứu được", "Thay đổi chưa commit bị hard xoá"],
            },
            code: `$ git reset --hard HEAD~2
$ git log --oneline
048b2c8 c1
$ git reflog
048b2c8 HEAD@{0}: reset: moving to HEAD~2
a70b202 HEAD@{1}: commit: c3 tinh nang quan trong
18d994c HEAD@{2}: commit: c2
048b2c8 HEAD@{3}: commit (initial): c1
$ git reset --hard 'HEAD@{1}'
$ git log --oneline
a70b202 c3 tinh nang quan trong
18d994c c2
048b2c8 c1`,
            takeaway: "Commit hiếm khi mất thật, thay đổi chưa commit thì có",
          },
          {
            title: "Revert: undo mà không sửa lịch sử",
            diagram: { kind: "pipe", from: "commit c3 đã push", via: "git revert", to: "commit mới làm ngược c3", skipped: ["Sửa lịch sử", "push --force"], skippedLabel: "Không cần" },
            code: `$ git revert --no-edit HEAD
$ git log --oneline
32d31ca Revert "c3"
be31628 c3
2e55f1e c2
7b36edc c1`,
            takeaway: "Lịch sử chỉ dài thêm, an toàn cho nhánh chung",
          },
        ],
        conclusion: "**Kết luận:** chưa commit thì restore, đã chia sẻ thì revert, chỉ local thì reset, và reflog là lưới an toàn cho commit.",
      },
      cheat: [
        { name: "git restore f", one: "Bỏ thay đổi chưa commit của file", say: "Restore bỏ thay đổi ở working tree, chưa commit thì không lấy lại được, nên em kiểm tra git diff trước." },
        { name: "git revert", one: "Tạo commit làm ngược, không sửa lịch sử", say: "Commit đã push thì em revert chứ không reset, vì revert chỉ thêm một commit mới và không phá lịch sử của người khác." },
        { name: "git reset --soft / --mixed / --hard", one: "Dịch branch, mức độ động tới staging và working tree tăng dần", say: "Soft giữ thay đổi ở staging, mixed giữ ở working tree, hard xoá luôn. Em chỉ dùng hard khi chắc chắn." },
        { name: "git reflog", one: "Nhật ký mọi chỗ HEAD từng đứng, cứu commit", say: "Lỡ reset mất commit thì em xem reflog tìm hash cũ rồi reset hoặc tạo branch tại đó." },
      ],
      trap: {
        title: "reset rồi push --force trên nhánh chung",
        text: "Reset hoặc rebase nhánh đã push rồi `git push --force` làm lịch sử remote khác với máy của đồng nghiệp. Họ pull thì conflict kỳ lạ hoặc đẩy lại commit cũ. Trên nhánh chung (main, develop) em revert. Trên branch cá nhân chưa ai dựa vào thì dùng `--force-with-lease`.",
      },
      takeaway: {
        title: "Chọn lệnh theo tình huống",
        lines: [
          "Chưa commit: restore. Đã push hoặc chia sẻ: revert. Chỉ local: reset.",
          "reflog cứu commit bị mất, nhưng không cứu thay đổi chưa commit bị reset --hard.",
        ],
      },
      quiz: {
        question: "Commit lỗi đã merge vào `main` và cả nhóm đã pull. Cách undo đúng là gì?",
        options: [
          "`git reset --hard HEAD~1` rồi `push --force`",
          "`git revert <commit>` để thêm một commit làm ngược, rồi push thường",
          "Xoá repo rồi clone lại",
          "`git restore .`",
        ],
        answer: 1,
        explain: "Main là nhánh chung, đã có người lấy về. Revert thêm commit mới nên không phá lịch sử của ai. Reset kèm push --force sẽ làm lịch sử của mọi người lệch nhau.",
      },
    },
    {
      id: "git-branching-strategy",
      title: "Phần 5: Chiến lược nhánh và bài toán chỉ lên một tính năng",
      intro: [
        "Không có một chiến lược nhánh đúng cho mọi đội. Có ba mô hình hay gặp, khác nhau ở số nhánh dài hạn và nhịp phát hành.",
        "- **Git flow**: có hai nhánh dài hạn `main` (mã đang chạy production, mỗi release gắn tag) và `develop` (mã tích hợp). Thêm `feature/*` (từ develop), `release/*` (cắt từ develop để ổn định trước khi lên), và `hotfix/*` (từ main để sửa gấp production). Hợp với sản phẩm phát hành theo phiên bản, nhưng nhiều nhánh, nhiều lần merge, dễ trôi lệch.",
        "- **GitHub flow**: chỉ có `main` luôn sẵn sàng deploy, mọi việc đi qua branch ngắn rồi PR vào main, merge xong deploy. Đơn giản, hợp web service deploy liên tục.",
        "- **Trunk-based**: mọi người commit vào một nhánh chính (trunk) thật thường xuyên, branch sống chỉ vài giờ đến một hai ngày. Cần CI tốt và feature flag cho phần dở dang (Phần 6).",
        "**Bài toán phỏng vấn kinh điển**: 'Nhiều người cùng merge vào `develop`. Đến ngày go-live, sếp chỉ muốn đẩy đúng tính năng của em. Làm sao?'. Vấn đề gốc: develop đã trộn cả tính năng A (của em) và B (chưa được duyệt), merge cả develop thì B cũng lên.",
        "Có ba cách giải, mỗi cách có đánh đổi:",
        "- **Release branch từ main rồi cherry-pick** commit của tính năng em: tạo `release/1.1` **từ main** (chỉ chứa thứ đang chạy production) rồi `git cherry-pick` đúng commit của A. Kiểm soát chính xác, nhưng chọn tay nên dễ sót commit phụ thuộc.",
        "- **Revert** những gì chưa muốn lên: cắt release từ develop rồi `git revert -m 1` merge commit của B. Hợp khi B là một merge commit gọn. Về sau muốn B lên thì phải revert cái revert.",
        "- **Feature flag**: cả A và B đều nằm trong code lên production, nhưng B bị tắt bằng cấu hình. Không cần xào nấu nhánh (Phần 6).",
        "Cherry-pick tạo **commit mới** giống nội dung, hash khác. Dùng `-x` để ghi nguồn gốc vào lời nhắn. Sau release nhớ merge `main` về `develop` để lịch sử hai bên khớp lại và không cherry-pick lần nữa.",
      ],
      board: {
        title: "Hai tính năng trên develop, chỉ lên A",
        highlight: "chỉ lên A",
        chips: ["develop", "release", "cherry-pick", "revert"],
        cards: [
          {
            title: "Cherry-pick A lên release cắt từ main",
            diagram: {
              kind: "flow",
              steps: ["develop có A và B", "release/1.1 cắt từ main", "cherry-pick -x commit của A", "Test rồi merge vào main, gắn tag"],
              ok: ["Production chỉ có A", "B vẫn nằm yên trên develop"],
              bad: ["Cắt release từ develop", "B bị kéo lên theo"],
            },
            code: `$ git log --oneline --graph      # trên develop
*   02e7fb7 Merge feature/b
|\\
| * 93a3361 feat(B): tinh nang B
|/
*   a695a92 Merge feature/a
|\\
| * dc5f914 feat(A): tinh nang A
|/
* 48edb79 Release 1.0
$ git switch main; git switch -c release/1.1
$ git cherry-pick -x dc5f914
[release/1.1 1756335] feat(A): tinh nang A
$ ls
a.txt  app.txt                    # chỉ có A, không có b.txt
$ git log --oneline release/1.1..develop
02e7fb7 Merge feature/b
a695a92 Merge feature/a
93a3361 feat(B): tinh nang B
dc5f914 feat(A): tinh nang A`,
            notes: ["Dòng cuối cho thấy develop vẫn có các commit chưa nằm trong release, kể cả commit A gốc, vì cherry-pick tạo commit khác hash (1756335)."],
            takeaway: "Release cắt từ main, chỉ chọn đúng commit",
          },
          {
            title: "Cắt từ develop rồi revert phần chưa muốn",
            diagram: { kind: "pipe", from: "release/1.2 cắt từ develop", via: "git revert -m 1 (merge của B)", to: "release chỉ còn A", skipped: ["Cherry-pick tay"], skippedLabel: "Không cần" },
            code: `$ git switch develop; git switch -c release/1.2
$ git revert --no-edit -m 1 02e7fb7
[release/1.2 9bd3885] Revert "Merge feature/b"
$ ls
a.txt  app.txt                    # b.txt đã bị gỡ`,
            notes: ["`-m 1` chọn cha thứ nhất (nhánh develop) làm dòng chính. Về sau muốn B lên thì phải revert chính commit revert này."],
            takeaway: "Hợp khi B là một merge commit gọn",
          },
          {
            title: "Feature flag: cả hai lên, B bị tắt (minh hoạ, chưa chạy)",
            diagram: { kind: "pipe", from: "A và B đều có trong code", via: "flag b.enabled=false", to: "production chỉ chạy A", skipped: ["Cherry-pick", "Revert"], skippedLabel: "Không cần" },
            code: `// Mã minh hoạ, chưa chạy
@Service
class CheckoutService {
    private final boolean installmentEnabled; // đọc từ cấu hình

    CheckoutService(@Value("\${features.installment.enabled:false}") boolean installmentEnabled) {
        this.installmentEnabled = installmentEnabled;
    }

    Receipt checkout(Order order) {
        if (installmentEnabled) {
            return payInInstallments(order);   // tính năng B, chưa duyệt
        }
        return payInFull(order);               // tính năng A, đang chạy
    }
}`,
            takeaway: "Tách deploy khỏi release bằng cấu hình",
          },
        ],
        conclusion: "**Kết luận:** muốn chỉ lên một tính năng thì hoặc chọn commit (cherry-pick), hoặc gỡ phần thừa (revert), hoặc tắt phần thừa (feature flag). 'Chờ gom hết rồi lên' không phải là câu trả lời.",
      },
      cheat: [
        { name: "Git flow", one: "main, develop, feature, release, hotfix", say: "Git flow có main và develop dài hạn, feature từ develop, release để ổn định, hotfix từ main. Hợp sản phẩm phát hành theo phiên bản, nhưng nặng." },
        { name: "GitHub flow", one: "Chỉ main, branch ngắn, PR rồi deploy", say: "GitHub flow chỉ có main luôn sẵn sàng deploy, mọi thay đổi đi qua branch ngắn và PR. Đơn giản, hợp deploy liên tục." },
        { name: "Trunk-based", one: "Commit thường xuyên vào trunk, dùng feature flag", say: "Trunk-based thì ai cũng tích hợp vào trunk mỗi ngày, phần dở dang giấu sau feature flag, cần CI mạnh." },
        { name: "cherry-pick", one: "Sao chép một commit sang nhánh khác", say: "Cherry-pick áp lại thay đổi của một commit lên nhánh khác dưới dạng commit mới. Em dùng nó để đưa đúng một tính năng vào release." },
      ],
      drill: {
        choices: ["Git flow", "GitHub flow", "Trunk-based"],
        items: [
          { q: "Web app nội bộ, deploy nhiều lần mỗi ngày, mỗi PR nhỏ, chỉ cần một nhánh luôn deploy được", a: "GitHub flow", why: "Một nhánh main sạch, branch ngắn, PR, merge xong deploy là đủ." },
          { q: "Phần mềm phát hành theo phiên bản 1.x, 2.x, phải vá nhiều phiên bản song song", a: "Git flow", why: "Release và hotfix branch cho phép ổn định và vá từng phiên bản." },
          { q: "Đội lớn, CI mạnh, muốn tích hợp liên tục và tránh branch sống lâu, giấu phần chưa xong sau flag", a: "Trunk-based", why: "Tích hợp mỗi ngày giảm conflict, flag cho phép code dở dang lên trunk mà không lộ." },
        ],
        summary: "Phát hành theo phiên bản thì Git flow, deploy liên tục thì GitHub flow hoặc trunk-based.",
      },
      trap: {
        title: "Cắt release từ develop rồi mong B không lên",
        text: "Release branch cắt từ `develop` mang theo mọi thứ develop đang có, kể cả tính năng chưa duyệt. Muốn chỉ lên A thì cắt từ `main` rồi chọn đúng commit, hoặc gỡ B bằng revert, hoặc tắt B bằng flag. Cherry-pick còn có thể sót commit phụ thuộc (A cần một hàm tiện ích nằm trong commit khác), nên phải test release.",
      },
      takeaway: {
        title: "Chỉ lên một tính năng",
        lines: [
          "Ba cách: cherry-pick lên release cắt từ main, revert phần chưa muốn, hoặc feature flag.",
          "Cherry-pick tạo commit mới, nhớ merge main về develop sau release.",
        ],
      },
      quiz: {
        question: "Develop có A (đã duyệt) và B (chưa duyệt). Cách nào đưa A lên production mà không đem B theo?",
        options: [
          "Merge cả develop vào main rồi hy vọng",
          "Cắt `release` từ main rồi `cherry-pick` các commit của A (hoặc gỡ B bằng revert, hoặc tắt B bằng feature flag)",
          "Đợi B xong rồi lên cùng",
          "Xoá develop",
        ],
        answer: 1,
        explain: "Merge cả develop mang B theo. Cherry-pick chọn đúng commit, revert gỡ phần thừa, flag tắt phần thừa. Chờ gom hết rồi lên là cách làm waterfall, không phải câu trả lời của một đội làm việc tốt.",
      },
    },
    {
      id: "git-trunk-agile",
      senior: true,
      title: "Phần 6: Trunk-based, feature flag, CI/CD, rollback và Agile",
      intro: [
        "Câu chuyện Phần 5 cho thấy gốc của vấn đề là **gắn chặt deploy với release**. Cách trưởng thành hơn là tách hai việc ra.",
        "- **Deploy**: đưa code lên môi trường production. Đây là việc kỹ thuật.",
        "- **Release**: cho người dùng thật **dùng được** tính năng. Đây là quyết định kinh doanh.",
        "Với **feature flag**, code của B có thể đã deploy từ lâu nhưng tắt. Đến ngày go-live chỉ cần bật flag, không phải đụng nhánh. Muốn rollback thì tắt flag trong vài giây, không cần build lại. Đổi lại phải trả giá: flag cũ phải được dọn (nợ kỹ thuật), và code có hai đường cần test cả hai.",
        "**CI/CD** làm cho trunk-based khả thi. CI build và chạy test mọi PR để main luôn xanh. CD tự động đưa bản build lên môi trường. Release nhỏ, thường xuyên thì mỗi lần ít rủi ro, dễ biết thay đổi nào gây lỗi, và rollback đơn giản.",
        "**Rollback** có ba hướng: tắt feature flag (nhanh nhất), deploy lại bản build trước (an toàn nếu không có thay đổi database không tương thích), hoặc `git revert` rồi deploy (khi lỗi nằm trong code). Thay đổi schema database cần thiết kế tương thích hai chiều, vì code cũ phải chạy được với schema mới khi rollback.",
        "**Agile** ngắn gọn: thay vì làm hết yêu cầu rồi mới giao một lần (**waterfall**: phân tích, thiết kế, code, test, giao theo thứ tự, phát hiện sai ở cuối), đội giao **từng phần nhỏ chạy được** theo vòng ngắn và điều chỉnh theo phản hồi. Cách 'gom hết rồi mới lên' trong câu hỏi phỏng vấn chính là waterfall: mọi tính năng chờ nhau, rủi ro dồn vào một ngày go-live.",
        "Scrum, khung Agile phổ biến, có các thành phần:",
        "- **Product backlog**: danh sách việc cần làm, xếp theo độ ưu tiên (Product Owner giữ).",
        "- **Sprint**: vòng làm việc cố định, thường 1 đến 4 tuần, kết thúc bằng một bản chạy được.",
        "- **Các buổi**: sprint planning (chọn việc cho sprint), daily standup (cập nhật ngắn mỗi ngày), sprint review (cho các bên xem kết quả), retrospective (nhìn lại cách làm để cải thiện).",
        "- **Definition of Done**: tiêu chí cả đội thống nhất để coi một việc là xong, ví dụ code đã review, test qua, merge vào main, deploy được. Không đạt DoD thì chưa tính là xong.",
        "- **Release từng phần**: mỗi sprint giao thứ chạy được, tính năng chưa sẵn sàng thì để sau flag hoặc không merge.",
        "Cách trả lời bài toán 'chỉ lên tính năng của em' khi phỏng vấn: nêu **vấn đề gốc** (develop trộn nhiều tính năng), đưa **ba cách** với đánh đổi, nói em **ưu tiên feature flag nếu đội có hạ tầng đó**, còn không thì release cắt từ main kèm cherry-pick, và nói thẳng rằng **về lâu dài nên tránh** tình huống này bằng PR nhỏ, release thường xuyên.",
      ],
      cheat: [
        { name: "Deploy khác release", one: "Deploy là đưa code lên, release là cho người dùng dùng", say: "Em tách deploy với release bằng feature flag: code lên production trước, bật cho người dùng khi sẵn sàng, và rollback bằng cách tắt flag." },
        { name: "Feature flag", one: "Bật hoặc tắt tính năng bằng cấu hình", say: "Feature flag cho em đưa code dở dang lên trunk mà không lộ, và rollback trong vài giây. Đổi lại phải dọn flag cũ và test cả hai đường." },
        { name: "Definition of Done", one: "Tiêu chí chung để coi việc là xong", say: "DoD là cam kết của đội, ví dụ đã review, test qua, merge, deploy được. Chưa đạt thì chưa xong." },
        { name: "Agile so với waterfall", one: "Giao từng phần nhỏ và điều chỉnh, thay vì giao một lần ở cuối", say: "Waterfall phát hiện sai ở cuối. Agile giao từng phần chạy được theo sprint để nhận phản hồi sớm và giảm rủi ro mỗi lần release." },
      ],
      predict: {
        question: "Đội gom tất cả tính năng của quý rồi lên production một lần, và lần nào cũng có sự cố lớn. Nguyên nhân gốc thường là gì?",
        options: [
          "Dev viết code kém",
          "Một lần đổi quá nhiều thứ cùng lúc nên rủi ro dồn lại, khó biết thay đổi nào gây lỗi và khó rollback",
          "Production quá chậm",
          "Git bị lỗi",
        ],
        answer: 1,
        explain: "Batch càng lớn thì rủi ro mỗi lần càng cao và chẩn đoán càng khó. Release nhỏ, thường xuyên với CI/CD và feature flag làm mỗi lần ít thay đổi nên dễ kiểm soát.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Tách deploy khỏi release bằng feature flag, release nhỏ thường xuyên, thì không cần xào nấu nhánh để chọn tính năng.",
          "Gom hết rồi mới lên là waterfall: rủi ro dồn vào một ngày. Agile giao từng phần chạy được qua sprint.",
        ],
      },
      quiz: {
        question: "Lợi ích chính của feature flag trong tình huống 'chỉ lên tính năng A' là gì?",
        options: [
          "Không cần test nữa",
          "Code của B đã deploy nhưng tắt, go-live chỉ cần bật flag và rollback bằng cách tắt flag, không cần xào nấu nhánh",
          "Làm code chạy nhanh hơn",
          "Thay thế hoàn toàn Git",
        ],
        answer: 1,
        explain: "Flag tách deploy khỏi release. Bật hoặc tắt trong vài giây, không build lại. Cái giá là phải dọn flag cũ và test cả hai đường code.",
      },
    },
  ],
  modelAnswer:
    "Em hình dung Git theo ba nơi là working tree, staging và repository, và branch chỉ là con trỏ vào một commit. Khi làm nhóm em tạo branch ngắn, mở PR nhỏ để review, cập nhật branch bằng rebase khi nó chỉ mình em dùng, và nhập PR bằng squash hoặc merge theo quy ước của nhóm. Gặp conflict em đọc hai phía, hiểu ý định rồi mới sửa, chạy test rồi commit. Về undo, chưa commit thì restore, đã push thì revert để không phá lịch sử, còn reset chỉ dùng ở local, và nếu lỡ mất commit thì reflog cứu được. Em không rebase hay force push nhánh chung. Nếu develop có nhiều tính năng mà go-live chỉ muốn tính năng của em thì em cắt release từ main rồi cherry-pick đúng commit, hoặc revert phần chưa muốn, hoặc tốt nhất là dùng feature flag để deploy khác release và rollback bằng cách tắt flag. Về lâu dài em ủng hộ release nhỏ, thường xuyên theo Agile, vì gom hết rồi mới lên là cách waterfall và dồn rủi ro vào một ngày.",
  cards: [
    { q: "Working tree, staging, repository khác nhau thế nào?", a: "Working tree là file thật đang sửa. Staging là danh sách thay đổi chọn cho commit kế. Repository là lịch sử commit." },
    { q: "Branch và HEAD là gì?", a: "Branch là con trỏ có tên vào một commit. HEAD là con trỏ cho biết em đang đứng ở đâu, thường trỏ vào một branch." },
    { q: "Merge, rebase, squash khác nhau thế nào?", a: "Merge tạo merge commit và giữ lịch sử thật. Rebase viết lại commit cho thẳng hàng (hash đổi). Squash gộp cả branch thành một commit." },
    { q: "Vì sao không rebase nhánh đã chia sẻ?", a: "Rebase đổi hash commit. Người khác còn commit cũ nên lịch sử phân kỳ, gây conflict và có thể mất việc." },
    { q: "Cách đọc dấu conflict?", a: "Giữa <<<<<<< HEAD và ======= là bản nhánh hiện tại, giữa ======= và >>>>>>> là bản nhánh nhập vào. Sửa, xoá dấu, test, add rồi commit." },
    { q: "restore, revert, reset khác nhau thế nào?", a: "Restore bỏ thay đổi chưa commit. Revert thêm commit làm ngược, an toàn cho nhánh chung. Reset dịch con trỏ branch, sửa lịch sử." },
    { q: "reset --soft, --mixed, --hard?", a: "Soft giữ thay đổi ở staging, mixed giữ ở working tree nhưng chưa stage, hard xoá cả working tree." },
    { q: "reflog dùng để làm gì?", a: "Ghi mọi chỗ HEAD từng đứng trên máy em, dùng tìm hash cũ để cứu commit lỡ reset hay xoá branch." },
    { q: "Git flow, GitHub flow, trunk-based?", a: "Git flow: main, develop, feature, release, hotfix. GitHub flow: main và branch ngắn kèm PR. Trunk-based: commit vào trunk thường xuyên, dùng feature flag." },
    { q: "Develop có nhiều tính năng, chỉ muốn lên một tính năng?", a: "Cắt release từ main rồi cherry-pick commit của tính năng đó, hoặc revert phần chưa muốn, hoặc tắt phần chưa muốn bằng feature flag." },
    { q: "Deploy khác release thế nào?", a: "Deploy là đưa code lên production. Release là cho người dùng dùng. Feature flag tách hai việc, rollback bằng cách tắt flag." },
    { q: "Agile khác waterfall ra sao?", a: "Waterfall làm hết rồi giao một lần ở cuối. Agile giao từng phần chạy được theo sprint, nhận phản hồi và điều chỉnh sớm." },
  ],
};
