import type { Lesson } from "../types";

// Conceptual lesson on Raft. The quoted output comes from a small seeded Java 21 teaching simulation
// (synchronous calls, tick clock), not from a real Raft library; the page says so where it quotes it.
export const raftConsensus: Lesson = {
  slug: "raft-consensus",
  crumb: "Raft & đồng thuận",
  videoDir: "/videos/raft-consensus",
  videoVersion: "0",
  scenes: [],
  title: "Raft và đồng thuận: bầu leader, nhân bản log, quorum",
  subtitle:
    "Vì sao nhiều node cần đồng thuận, Raft bầu leader bằng term và timeout ngẫu nhiên, log được commit khi đa số đã ghi, quorum chịu được bao nhiêu node lỗi, và Raft khác ISR của Kafka ở đâu.",
  openingQuiz: {
    question: "Cluster 3 node chạy Raft. Mạng bị chia thành nhóm 1 node và nhóm 2 node. Nhóm nào còn ghi được dữ liệu mới?",
    options: ["Cả hai nhóm", "Chỉ nhóm 2 node, vì còn đa số (2/3)", "Chỉ nhóm có leader cũ", "Không nhóm nào"],
    answer: 1,
    explain:
      "Raft chỉ commit khi đa số node đã ghi. Nhóm 2 node có đa số nên bầu được leader và commit được. Node lẻ loi dù từng là leader cũng không gom đủ đa số, nên không commit được gì. Nhờ vậy không bao giờ có hai bên cùng ghi.",
  },
  roadmap: [
    "Chặng 1: vì sao cần đồng thuận (leader chết, split brain); Raft bầu leader bằng term, timeout ngẫu nhiên và đa số phiếu.",
    "Chặng 2: nhân bản log bằng AppendEntries, commit khi đa số đã ghi, vì sao leader mới luôn có đủ log đã commit.",
    "Chặng 3: quorum 3 node chịu 1 lỗi, 5 node chịu 2; phân vùng thiểu số; (senior) so với ISR của Kafka, KRaft, etcd và Consul.",
  ],
  sections: [
    {
      id: "why-consensus",
      title: "Phần 1: Vì sao cần đồng thuận",
      intro: [
        "Ta đã biết chạy nhiều bản sao (replica) để một máy chết thì hệ thống vẫn sống. Nhưng nhiều bản sao thì phải trả lời được: **ai được nhận ghi**, và **khi nào một lần ghi được coi là chắc chắn**?",
        "Cách đơn giản nhất là một node chính (leader) nhận ghi, các node khác chép theo. Vấn đề nằm ở lúc leader chết:",
        "- **Ai lên thay?** Nếu mỗi node tự quyết, có thể hai node cùng tự nhận là leader.",
        "- **Leader chết thật hay chỉ mất mạng?** Từ phía follower, hai trường hợp trông giống hệt nhau: không nhận được tin.",
        "- **Dữ liệu nào là đúng?** Leader cũ có thể đã nhận vài lần ghi mà follower chưa kịp chép.",
        "**Split brain** là khi mạng bị chia đôi và mỗi bên đều có một leader nhận ghi. Hai bên ghi khác nhau, lúc mạng nối lại không biết giữ bản nào. Ví dụ: hai leader cùng trừ tồn kho cho cùng một sản phẩm, bán quá số lượng.",
        "**Đồng thuận (consensus)** là để nhiều node thống nhất về một chuỗi quyết định (ai là leader, thứ tự các lần ghi) ngay cả khi một số node chết hoặc mạng chập chờn. Cách làm cốt lõi: **mọi quyết định cần đa số đồng ý**. Hai nhóm rời nhau không thể cùng là đa số, nên không thể có hai quyết định trái nhau.",
        "Raft (2014) là thuật toán đồng thuận được viết ra để **dễ hiểu** hơn Paxos. Nó chia bài toán thành ba phần: bầu leader, nhân bản log, và an toàn (không mất dữ liệu đã commit).",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Leader chết hoặc mất mạng → node khác tự nhận leader → nếu không cần đa số thì có hai leader (split brain) → dữ liệu lệch.",
          "Bắt mọi quyết định cần đa số → hai nhóm rời nhau không thể cùng đa số → tối đa một leader ghi được.",
        ],
      },
      trap: {
        title: "Timeout không phân biệt được chết hay chậm",
        text: "Follower không bao giờ biết chắc leader đã chết, nó chỉ biết đã lâu không nghe tin. Vì vậy thiết kế phải an toàn cả khi leader cũ vẫn sống và tiếp tục nhận ghi. Raft xử lý bằng term và đa số, không dựa vào việc đoán đúng leader đã chết.",
      },
      quiz: {
        question: "Split brain là gì?",
        options: [
          "Một node bị hết bộ nhớ",
          "Mạng bị chia và mỗi bên đều có một leader nhận ghi, dữ liệu hai bên lệch nhau",
          "Leader ghi chậm hơn follower",
          "Hai client cùng đọc một bản ghi",
        ],
        answer: 1,
        explain: "Split brain là có hai leader cùng nhận ghi ở hai phía của một phân vùng mạng. Đồng thuận theo đa số ngăn chuyện này vì chỉ một phía có đa số.",
      },
    },
    {
      id: "raft-election",
      title: "Phần 2: Raft bầu leader",
      intro: [
        "Phần 1 nói cần đa số. Vậy Raft dùng đa số để bầu leader như thế nào?",
        "Mỗi node ở một trong ba vai:",
        "- **Follower**: bị động, nghe leader, trả lời yêu cầu bầu cử. Mọi node khởi động là follower.",
        "- **Candidate**: follower lâu không nghe leader thì tự ứng cử.",
        "- **Leader**: nhận mọi lần ghi từ client, gửi **heartbeat** đều đặn để follower biết mình còn sống.",
        "**Term** là số nhiệm kỳ, chỉ tăng. Mỗi term có tối đa một leader. Mọi tin nhắn đều mang term của người gửi: node thấy term lớn hơn của mình thì cập nhật term và lùi về follower. Nhờ vậy leader cũ quay lại sẽ tự biết mình đã hết thời.",
        "Quá trình bầu:",
        "- Follower không nhận heartbeat trong **election timeout** thì tăng term, tự bầu cho mình, gửi `RequestVote` cho các node khác.",
        "- Mỗi node chỉ bầu **một phiếu cho mỗi term**, ai hỏi trước được trước, và chỉ bầu nếu log của candidate **ít nhất mới bằng** log của mình (Phần 3 giải thích vì sao).",
        "- Candidate nhận phiếu của **đa số** (tính cả phiếu của mình) thì thành leader và gửi heartbeat ngay.",
        "- Không ai đủ đa số (chia phiếu) thì hết timeout bầu lại với term mới.",
        "**Timeout ngẫu nhiên** là mẹo chính: mỗi node chọn timeout ngẫu nhiên trong một khoảng (bài báo gợi ý 150 đến 300 ms). Thường một node hết giờ trước hẳn, xin phiếu xong trước khi các node khác kịp ứng cử, nên hiếm khi chia phiếu.",
        "Để xem rõ, mình viết một **mô phỏng dạy học** nhỏ bằng Java 21 (không phải Raft thật: gọi hàm đồng bộ thay cho mạng, đồng hồ đếm tick, random với seed 42 để lần nào chạy cũng ra giống nhau). Timeout ở đây là 10 đến 19 tick.",
      ],
      board: {
        title: "Bầu leader trong mô phỏng",
        highlight: "leader",
        chips: ["Follower", "Candidate", "Leader", "Term", "Đa số"],
        cards: [
          {
            title: "Bầu lần đầu",
            diagram: {
              kind: "flow",
              steps: ["Mọi node là follower", "n0 hết timeout trước (t=10)", "Term 1, xin phiếu", "Đủ đa số"],
              ok: ["Thành leader", "Gửi heartbeat, các node reset timeout"],
              bad: ["Chia phiếu", "Hết timeout, bầu lại với term mới"],
            },
            code: `== 1. Normal election (5 nodes, seed 42)
n0 timeout=10  n1 timeout=13  n2 timeout=18  n3 timeout=14  n4 timeout=10
t=10  n0 timeout -> CANDIDATE term 1, votes 5/5 from [n0, n1, n2, n3, n4]
t=10  n0 becomes LEADER of term 1`,
            notes: ["n0 và n4 cùng có timeout 10, nhưng n0 xin phiếu trước nên n4 đã bầu cho n0 và được reset timeout. Trong mạng thật hai node có thể cùng ứng cử, khi đó chia phiếu và bầu lại."],
            takeaway: "Timeout ngẫu nhiên làm một node thường thắng ngay",
          },
          {
            title: "Leader chết, term tăng",
            diagram: {
              kind: "flow",
              steps: ["n0 (leader term 1) chết", "Hết heartbeat", "n1 hết timeout", "Term 2, 4/5 phiếu"],
              ok: ["n1 leader term 2", "Đủ 3/5, không cần n0"],
              bad: ["n0 quay lại", "Thấy term 2, lùi về follower"],
            },
            code: `== 3. Leader n0 crashes
t=31  n1 timeout -> CANDIDATE term 2, votes 4/5 from [n1, n2, n3, n4]
t=31  n1 becomes LEADER of term 2`,
            takeaway: "Term mới làm leader cũ tự lùi về follower",
          },
        ],
        conclusion: "**Kết luận:** term là đồng hồ logic của cluster. Một term tối đa một leader, vì mỗi node chỉ bầu một phiếu mỗi term và cần đa số.",
      },
      after: [
        "Ở phần 4 của mô phỏng có một ca chia phiếu thật: n0 vừa khởi động lại ứng cử term 2 nhưng chỉ được 1/5 phiếu, vì các node khác đã bầu trong term 2 rồi. Cùng tick đó n4 ứng cử term 3 và thắng 3/5.",
      ],
      takeaway: {
        lines: [
          "Ba vai: follower, candidate, leader. Term chỉ tăng, mỗi term tối đa một leader.",
          "Hết timeout thì ứng cử, cần đa số phiếu. Timeout ngẫu nhiên để ít khi chia phiếu.",
        ],
      },
      quiz: {
        question: "Vì sao Raft cho mỗi node election timeout ngẫu nhiên?",
        options: [
          "Để tiết kiệm CPU",
          "Để thường chỉ một node hết giờ trước và thắng, tránh nhiều node cùng ứng cử rồi chia phiếu mãi",
          "Để leader gửi heartbeat nhanh hơn",
          "Để chọn node có cấu hình mạnh nhất",
        ],
        answer: 1,
        explain: "Nếu mọi node cùng timeout, chúng cùng ứng cử và chia phiếu, rồi lại cùng bầu lại. Ngẫu nhiên hoá làm một node đi trước, xin đủ phiếu trước khi node khác ứng cử.",
      },
    },
    {
      id: "log-replication",
      title: "Phần 3: Nhân bản log và commit",
      intro: [
        "Có leader rồi. Giờ một lần ghi từ client đi thế nào để không mất?",
        "Raft coi dữ liệu là một **log**: danh sách lệnh theo thứ tự, mỗi entry ghi kèm term lúc được tạo. Mọi node áp dụng cùng một log theo cùng thứ tự thì ra cùng trạng thái (state machine replication).",
        "- **Leader nhận lệnh**: thêm vào cuối log của mình. Lúc này **chưa commit**.",
        "- **AppendEntries**: leader gửi entry mới cho follower. Heartbeat chính là AppendEntries rỗng.",
        "- **Kiểm tra khớp**: mỗi AppendEntries kèm index và term của entry ngay trước. Follower không khớp thì từ chối, leader lùi lại một entry và gửi lại, tới khi khớp. Phần đuôi lệch của follower bị ghi đè bằng log của leader.",
        "- **Commit**: khi **đa số** node đã ghi entry đó, leader đánh dấu commit, áp dụng vào state machine và trả lời client thành công. Follower biết commit index qua lần AppendEntries tiếp theo.",
        "Còn lại một câu hỏi: leader chết ngay sau khi commit, leader mới có chắc giữ entry đó không? Có, nhờ **luật bầu cử** ở Phần 2: node chỉ bầu cho candidate có log ít nhất mới bằng mình (so term của entry cuối, bằng nhau thì so độ dài). Entry đã commit nằm trên đa số; candidate cần phiếu của đa số; hai đa số luôn giao nhau ở ít nhất một node có entry đó, và node này sẽ từ chối candidate thiếu entry. Vậy **leader mới luôn có đủ mọi entry đã commit**.",
      ],
      predict: {
        question: "Cluster 5 node. Leader ghi `x=1` vào log của mình. Cần bao nhiêu node (tính cả leader) đã ghi thì entry được commit?",
        options: ["1, chỉ cần leader", "3, đa số của 5", "4", "Cả 5"],
        answer: 1,
        explain: "Đa số của 5 là 3. Không cần chờ cả 5, nên 2 node chậm hoặc chết không chặn được việc ghi.",
      },
      board: {
        title: "Commit khi đa số đã ghi",
        highlight: "đa số",
        chips: ["Log", "AppendEntries", "Commit index"],
        cards: [
          {
            title: "Một lần ghi bình thường",
            diagram: {
              kind: "flow",
              steps: ["Client gửi x=1", "Leader thêm vào log", "AppendEntries tới follower", "Đếm số node đã ghi"],
              ok: ["Đủ đa số", "Commit, trả lời client"],
              bad: ["Chưa đủ", "Giữ chưa commit, tiếp tục gửi lại"],
            },
            code: `== 2. Commit after majority ack
t=20  client -> n0 (term 1): append 'x=1' at index 1, not committed yet
t=21  n0 commits index 1 (x=1), stored on 5/5
      n0 LEADER    term=1 commit=1 log=[1:x=1]
      n1 FOLLOWER  term=1 commit=1 log=[1:x=1]
      ...`,
            notes: ["`1:x=1` nghĩa là entry tạo ở term 1. Mô phỏng gửi đồng bộ nên cả 5 node ghi cùng lúc; ở mạng thật leader commit ngay khi đủ 3 xác nhận, không chờ 2 node còn lại."],
            takeaway: "Ghi vào log chưa phải commit, đủ đa số mới là commit",
          },
        ],
        conclusion: "**Kết luận:** client chỉ nhận thành công sau khi đa số đã ghi. Luật bầu cử bảo đảm leader sau luôn có entry đó.",
      },
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Entry đã commit nằm trên đa số → mọi leader mới cần phiếu đa số → hai đa số giao nhau → node chung từ chối candidate thiếu entry → leader mới luôn có entry đã commit.",
        ],
      },
      trap: {
        title: "Entry chưa commit có thể bị xoá",
        text: "Leader đã ghi một entry vào log nhưng chưa đủ đa số rồi chết: entry đó có thể bị leader mới ghi đè. Điều này đúng thiết kế, vì client chưa từng được báo thành công. Chỉ entry đã commit mới được hứa là không mất.",
      },
      quiz: {
        question: "Vì sao leader mới trong Raft không làm mất entry đã commit?",
        options: [
          "Vì leader mới tải log từ đĩa của leader cũ",
          "Vì node chỉ bầu cho candidate có log ít nhất mới bằng mình, và đa số bầu luôn giao với đa số đã ghi entry",
          "Vì client gửi lại mọi lệnh",
          "Vì Raft không cho leader chết",
        ],
        answer: 1,
        explain: "Đây là luật bầu cử (election restriction). Candidate thiếu entry đã commit sẽ bị ít nhất một node trong đa số từ chối, nên không thể thắng.",
      },
    },
    {
      id: "quorum",
      title: "Phần 4: Quorum và phân vùng mạng",
      intro: [
        "Phần 3 dùng chữ \"đa số\" rất nhiều. **Quorum** chính là số node tối thiểu phải đồng ý: với N node, quorum là `N/2 + 1` (chia lấy phần nguyên).",
        "- **3 node**: quorum 2, chịu được **1** node lỗi.",
        "- **5 node**: quorum 3, chịu được **2** node lỗi.",
        "- **4 node**: quorum 3, vẫn chỉ chịu **1** lỗi như 3 node mà tốn thêm một máy. Vì vậy cluster đồng thuận thường có số node **lẻ**.",
        "Thêm node không làm ghi nhanh hơn: mỗi lần ghi phải chờ nhiều xác nhận hơn. Thường dùng 3 hoặc 5 node, hiếm khi 7.",
        "Khi mạng chia: phía có đa số bầu leader và ghi bình thường. Phía **thiểu số** không bầu được leader mới và không commit được, kể cả khi leader cũ đang ở phía đó. Hệ thống chọn **nhất quán hơn sẵn sàng**: phía thiểu số thà từ chối ghi còn hơn ghi sai (đây là lựa chọn CP trong định lý CAP).",
        "Mô phỏng ở bước 4: chia 5 node thành `{n1, n2}` (n1 đang là leader term 2) và `{n0, n3, n4}`. Client ghi `y=2` vào n1, rồi `z=3` vào leader mới bên đa số.",
      ],
      predict: {
        question: "n1 vẫn tưởng mình là leader và nhận `y=2`, nhưng chỉ nói chuyện được với n2. Chuyện gì xảy ra với `y=2` khi mạng nối lại?",
        options: [
          "Được commit vì n1 là leader hợp lệ",
          "Không bao giờ commit, và bị ghi đè bằng log của leader term mới",
          "Cả hai nhánh được trộn lại",
          "n1 giữ quyền leader vì có dữ liệu mới hơn",
        ],
        answer: 1,
        explain: "n1 chỉ có 2/5 node, không đủ quorum 3, nên `y=2` không commit. Khi nối lại, n1 thấy term 3 lớn hơn, lùi về follower, và đuôi log lệch bị ghi đè.",
      },
      board: {
        title: "Phân vùng thiểu số không commit được",
        highlight: "thiểu số",
        chips: ["Quorum", "Phân vùng", "Term cao hơn"],
        cards: [
          {
            title: "Lúc đang chia mạng",
            diagram: {
              kind: "flow",
              steps: ["Chia {n1,n2} | {n0,n3,n4}", "n1 nhận y=2", "n4 thắng bầu term 3 (3/5)", "n4 nhận z=3"],
              ok: ["Phía đa số", "z=3 commit, 3/5"],
              bad: ["Phía thiểu số", "y=2 chỉ trên 2/5, không commit"],
            },
            code: `t=48  partition: n1,n2 | rest
t=48  client -> n1 (term 2): append 'y=2' at index 2, not committed yet
t=58  n0 timeout -> CANDIDATE term 2, votes 1/5 from [n0]
t=58  n4 timeout -> CANDIDATE term 3, votes 3/5 from [n4, n0, n3]
t=58  n4 becomes LEADER of term 3
t=78  n1 still thinks it is leader of term 2: 'y=2' on 2/5, needs 3, commit stays 1
t=78  client -> n4 (term 3): append 'z=3' at index 2, not committed yet
t=81  n4 commits index 2 (z=3), stored on 3/5`,
            takeaway: "Hai leader cùng tồn tại nhưng chỉ một bên commit được",
          },
          {
            title: "Sau khi nối mạng",
            diagram: {
              kind: "flow",
              steps: ["Mạng nối lại", "n1 nhận tin term 3", "n1 lùi về follower", "Log được đồng bộ"],
              ok: ["Giữ lại", "z=3 đã commit"],
              bad: ["Bị ghi đè", "y=2 chưa từng commit"],
            },
            code: `t=81  partition healed
t=84  n1 sees term 3 from n0, steps down
      n1 FOLLOWER  term=3 commit=2 log=[1:x=1, 3:z=3]
      n2 FOLLOWER  term=3 commit=2 log=[1:x=1, 3:z=3]
      n4 LEADER    term=3 commit=2 log=[1:x=1, 3:z=3]`,
            takeaway: "Term cao hơn thắng, entry chưa commit bị thay",
          },
        ],
        conclusion: "**Kết luận:** có lúc hai node cùng tự gọi mình là leader, nhưng chỉ leader có đa số mới commit được. Đó là cách Raft tránh split brain về dữ liệu.",
      },
      drill: {
        choices: ["Ghi được", "Không ghi được"],
        items: [
          { q: "Cluster 3 node, 1 node chết", a: "Ghi được", why: "Còn 2/3, đủ quorum 2." },
          { q: "Cluster 3 node, 2 node chết", a: "Không ghi được", why: "Còn 1/3, không đủ quorum 2. Đọc an toàn cũng không được vì không xác nhận được mình còn là leader." },
          { q: "Cluster 5 node, 2 node chết", a: "Ghi được", why: "Còn 3/5, đủ quorum 3." },
          { q: "Cluster 5 node, mạng chia 2 và 3, xét phía 2 node", a: "Không ghi được", why: "2/5 là thiểu số, không bầu được và không commit được." },
          { q: "Cluster 4 node, mạng chia đôi 2 và 2", a: "Không ghi được", why: "Quorum của 4 là 3, không phía nào đủ. Đây là lý do tránh số node chẵn." },
        ],
        summary: "Đếm số node còn nói chuyện được với nhau, so với `N/2 + 1`. Đủ thì ghi được, thiếu thì đứng chờ.",
      },
      takeaway: {
        lines: [
          "Quorum = N/2 + 1. 3 node chịu 1 lỗi, 5 node chịu 2. Số node chẵn không thêm khả năng chịu lỗi.",
          "Phía thiểu số không bầu, không commit: chọn nhất quán thay vì sẵn sàng.",
        ],
      },
      quiz: {
        question: "Vì sao cluster Raft 4 node không tốt hơn 3 node về khả năng chịu lỗi?",
        options: [
          "Vì Raft không chạy được với số chẵn",
          "Vì quorum của 4 là 3, nên cũng chỉ chịu 1 node lỗi như 3 node, mà mỗi lần ghi phải chờ thêm",
          "Vì 4 node luôn chia phiếu",
          "Thật ra 4 node chịu được 2 lỗi",
        ],
        answer: 1,
        explain: "Chịu lỗi = N - quorum. 3 node: 3 - 2 = 1. 4 node: 4 - 3 = 1. Thêm máy thứ tư chỉ tốn tiền và còn sinh khả năng chia đôi 2-2 không ai ghi được.",
      },
    },
    {
      id: "raft-vs-isr",
      title: "Phần 5: So với ISR của Kafka, KRaft, etcd và cách trả lời",
      senior: true,
      intro: [
        "Câu phỏng vấn thường hỏi chung: \"Raft là gì? ISR là gì?\". Bài Kafka (Phần 1 và phần về `acks`) đã giải thích ISR, `acks=all` và `min.insync.replicas`. Ở đây chỉ so hai cách nghĩ.",
        "- **Raft (quorum đa số)**: commit khi **đa số cố định** đã ghi. Có 2f+1 node để chịu f lỗi. Không cần biết node nào chậm, cứ đủ đa số là đi tiếp.",
        "- **ISR của Kafka**: leader của partition giữ danh sách replica đang theo kịp. Với `acks=all`, ghi được coi là xong khi **mọi replica trong ISR** đã ghi; replica chậm bị loại khỏi ISR để không kéo cả hệ thống. Leader mới chọn trong ISR. Nhờ vậy f+1 replica chịu được f lỗi, rẻ hơn quorum, nhưng ISR có thể co lại chỉ còn leader, nên phải đặt `min.insync.replicas` để từ chối ghi khi ISR quá nhỏ.",
        "- **Ai quyết định ISR và leader?** Trong Kafka đó là **controller**. Trước đây controller dựa vào ZooKeeper (ZooKeeper dùng giao thức ZAB, không phải Raft). Từ **KRaft** (KIP-500), metadata của cluster nằm trong một log được nhân bản giữa các controller bằng giao thức dựa trên Raft. Kafka 4.0 đã bỏ hẳn ZooKeeper.",
        "Tóm lại trong Kafka: **metadata** (ai là leader, ISR gồm ai) đi qua Raft trong KRaft; còn **dữ liệu từng partition** vẫn nhân bản theo ISR. Hai cơ chế khác nhau sống cùng một hệ thống.",
        "Raft còn ở đâu: **etcd** (nơi Kubernetes lưu toàn bộ trạng thái cluster) và **Consul** (các server node) dùng Raft. Vì vậy etcd thường chạy 3 hoặc 5 node, và mất đa số thì Kubernetes không đổi được trạng thái.",
      ],
      cheat: [
        { name: "Raft", one: "Đồng thuận theo đa số: bầu leader, nhân bản log, commit khi đa số ghi", say: "Raft là thuật toán đồng thuận: node lâu không nghe leader thì tăng term và xin phiếu, đủ đa số thì thành leader; mỗi lần ghi được commit khi đa số node đã ghi, và luật bầu cử bảo đảm leader mới có đủ log đã commit." },
        { name: "Term", one: "Số nhiệm kỳ chỉ tăng, mỗi term tối đa một leader", say: "Term là đồng hồ logic. Node thấy term lớn hơn thì lùi về follower, nên leader cũ quay lại không gây hại." },
        { name: "Quorum", one: "N/2 + 1 node; 3 chịu 1 lỗi, 5 chịu 2", say: "Quorum là đa số. Hai đa số luôn giao nhau, nên không có hai quyết định trái nhau. Dùng số node lẻ." },
        { name: "ISR", one: "Replica đang theo kịp leader của partition Kafka", say: "ISR là tập replica theo kịp leader; acks=all chờ cả ISR, leader mới chọn trong ISR, min.insync.replicas chặn ghi khi ISR co quá nhỏ." },
        { name: "KRaft", one: "Kafka quản lý metadata bằng giao thức dựa trên Raft, bỏ ZooKeeper", say: "KRaft đưa metadata vào một log nhân bản giữa các controller theo kiểu Raft; dữ liệu partition vẫn theo ISR." },
      ],
      drill: {
        choices: ["Raft (quorum đa số)", "Kafka ISR", "Cả hai đều không"],
        items: [
          { q: "Lưu trạng thái cluster Kubernetes trong etcd", a: "Raft (quorum đa số)", why: "etcd nhân bản dữ liệu bằng Raft." },
          { q: "Nhân bản message của một partition, producer dùng acks=all", a: "Kafka ISR", why: "Dữ liệu partition chờ mọi replica trong ISR, không theo đa số cố định." },
          { q: "Controller của Kafka 4.0 lưu ai là leader của partition nào", a: "Raft (quorum đa số)", why: "KRaft lưu metadata trong log nhân bản giữa các controller bằng giao thức dựa trên Raft." },
          { q: "Hai instance service ghi vào hai database riêng rồi đồng bộ mỗi giờ", a: "Cả hai đều không", why: "Không có leader chung hay đa số, đây là đồng bộ bất đồng bộ, có thể xung đột." },
        ],
        summary: "Metadata và kho cấu hình nhỏ (etcd, Consul, KRaft) dùng Raft. Dữ liệu partition Kafka dùng ISR.",
      },
      takeaway: {
        lines: [
          "Raft: 2f+1 node chịu f lỗi, commit theo đa số. ISR: f+1 replica chịu f lỗi, commit khi cả ISR ghi, cần min.insync.replicas làm chốt chặn.",
          "Kafka KRaft dùng Raft cho metadata, còn dữ liệu partition vẫn theo ISR.",
        ],
      },
      trap: {
        title: "Đừng nói \"Kafka dùng Raft để nhân bản message\"",
        text: "KRaft chỉ thay ZooKeeper cho phần metadata. Message trong partition vẫn nhân bản theo ISR. Nói nhầm hai thứ là dấu hiệu chỉ đọc lướt tiêu đề.",
      },
      quiz: {
        question: "Kafka với KRaft dùng cơ chế nào cho dữ liệu message của một partition?",
        options: [
          "Raft, commit khi đa số broker ghi",
          "ISR: leader partition chờ các replica in-sync, leader mới chọn trong ISR",
          "ZooKeeper",
          "Không nhân bản",
        ],
        answer: 1,
        explain: "KRaft dùng giao thức dựa trên Raft cho metadata giữa các controller. Dữ liệu partition vẫn theo ISR như trước.",
      },
      parts: [
        {
          id: "raft-interview-answer",
          title: "Trả lời phỏng vấn và lỗi hay gặp",
          intro: [
            "Một cách trả lời khoảng 30 giây cho \"Raft là gì?\": nêu bài toán, ba vai, bầu cử, commit theo đa số, và một ví dụ thật.",
            "- **Bài toán**: nhiều node cần thống nhất ai là leader và thứ tự lần ghi, kể cả khi node chết hoặc mạng chia.",
            "- **Bầu cử**: follower hết timeout ngẫu nhiên thì tăng term, xin phiếu, đủ đa số là leader, gửi heartbeat.",
            "- **Ghi**: leader thêm vào log, gửi AppendEntries, đủ đa số ghi thì commit.",
            "- **An toàn**: node chỉ bầu cho candidate có log ít nhất mới bằng mình, nên leader mới không thiếu entry đã commit.",
            "- **Ví dụ**: etcd của Kubernetes, Consul, KRaft của Kafka.",
            "Câu hỏi nối tiếp hay gặp ở senior: \"Leader có được commit entry của term cũ chỉ bằng cách đếm đủ đa số không?\". Không. Raft chỉ commit bằng đếm đa số với entry của **term hiện tại**; entry term cũ được commit gián tiếp khi một entry term hiện tại sau nó được commit. Đây là ca trong Hình 8 của bài báo Raft, nơi đếm đa số cho entry cũ có thể dẫn tới mất dữ liệu. Mô phỏng ở trên cũng chỉ commit entry của term hiện tại.",
          ],
          trap: {
            title: "Nhầm \"đã ghi vào leader\" với \"đã commit\"",
            text: "Client chỉ được báo thành công khi entry đã commit (đa số đã ghi). Trả lời rằng leader ghi xong là xong sẽ bị hỏi vặn ngay: leader chết lúc đó thì sao?",
          },
          quiz: {
            question: "Trong Raft, leader term 5 thấy một entry của term 3 đã nằm trên đa số node. Leader có được đánh dấu commit nó ngay chỉ vì đếm đủ đa số không?",
            options: [
              "Có, đủ đa số là commit",
              "Không, chỉ entry của term hiện tại mới commit bằng đếm đa số; entry cũ được commit theo khi một entry term 5 sau nó commit",
              "Có, nếu client gửi lại",
              "Không, entry term cũ luôn bị xoá",
            ],
            answer: 1,
            explain: "Đây là quy tắc trong bài báo Raft (mục 5.4.2, Hình 8). Entry cũ vẫn có thể bị ghi đè nếu commit chỉ bằng đếm; commit một entry term hiện tại thì mọi entry trước nó được commit theo.",
          },
        },
      ],
    },
  ],
  modelAnswer:
    "Raft là thuật toán đồng thuận để nhiều node thống nhất ai là leader và thứ tự các lần ghi, kể cả khi node chết hay mạng bị chia. Mỗi node là follower, candidate hoặc leader. Follower lâu không nhận heartbeat thì hết một timeout ngẫu nhiên, tăng term, tự ứng cử và xin phiếu; ai được đa số thì thành leader của term đó, mỗi node chỉ bầu một phiếu mỗi term nên một term có tối đa một leader. Khi ghi, leader thêm lệnh vào log, gửi AppendEntries cho follower, và chỉ commit, trả lời client, khi đa số node đã ghi. Node chỉ bầu cho candidate có log ít nhất mới bằng mình, nên leader mới luôn có đủ log đã commit. Vì cần đa số, cụm 3 node chịu được 1 lỗi, 5 node chịu được 2, và phía thiểu số khi mạng chia không ghi được, nên không có split brain. Em hay gặp Raft trong etcd của Kubernetes và KRaft của Kafka. Còn ISR là tập replica đang theo kịp leader của một partition Kafka: acks=all chờ cả ISR, leader mới chọn trong ISR, và min.insync.replicas chặn ghi khi ISR co quá nhỏ. Dữ liệu partition dùng ISR, còn metadata trong KRaft mới dùng Raft.",
  cards: [
    { q: "Split brain là gì?", a: "Mạng chia và mỗi phía đều có leader nhận ghi, dữ liệu hai phía lệch nhau." },
    { q: "Ba vai của node trong Raft?", a: "Follower, candidate, leader." },
    { q: "Term là gì?", a: "Số nhiệm kỳ chỉ tăng; mỗi term tối đa một leader; thấy term lớn hơn thì lùi về follower." },
    { q: "Vì sao election timeout ngẫu nhiên?", a: "Để thường chỉ một node ứng cử trước và thắng, ít chia phiếu." },
    { q: "Khi nào một entry được commit?", a: "Khi đa số node đã ghi entry đó (và entry thuộc term hiện tại của leader)." },
    { q: "Vì sao leader mới không thiếu entry đã commit?", a: "Node chỉ bầu cho candidate có log ít nhất mới bằng mình; đa số bầu giao với đa số đã ghi." },
    { q: "Quorum của 3 và 5 node? Chịu bao nhiêu lỗi?", a: "3 node: quorum 2, chịu 1. 5 node: quorum 3, chịu 2." },
    { q: "Vì sao tránh số node chẵn?", a: "4 node vẫn chỉ chịu 1 lỗi như 3 node, và có thể chia đôi 2-2 không ai ghi được." },
    { q: "Phía thiểu số khi mạng chia làm gì?", a: "Không bầu được leader mới, không commit được. Leader cũ ở đó tự lùi khi thấy term cao hơn." },
    { q: "Raft khác Kafka ISR thế nào?", a: "Raft: 2f+1 node, commit theo đa số. ISR: f+1 replica, acks=all chờ cả ISR, cần min.insync.replicas." },
    { q: "KRaft dùng Raft cho gì?", a: "Cho metadata của cluster giữa các controller, thay ZooKeeper. Dữ liệu partition vẫn theo ISR." },
  ],
};
