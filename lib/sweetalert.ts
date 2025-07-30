import Swal from 'sweetalert2'

// 自定义主题配置
const customTheme = {
  confirmButtonColor: '#3b82f6',
  cancelButtonColor: '#ef4444',
  background: '#ffffff',
  color: '#1f2937',
}

// 成功提示
export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    ...customTheme,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
  })
}

// 错误提示
export const showError = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    ...customTheme,
  })
}

// 警告提示
export const showWarning = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    ...customTheme,
  })
}

// 信息提示
export const showInfo = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    ...customTheme,
  })
}

// 确认对话框
export const showConfirm = (title: string, text?: string, confirmText = '确认', cancelText = '取消') => {
  return Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    ...customTheme,
  })
}

// 删除确认
export const showDeleteConfirm = (title = '确认删除？', text = '此操作不可撤销') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    background: customTheme.background,
    color: customTheme.color,
  })
}

// 加载提示
export const showLoading = (title = '处理中...', text?: string) => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading()
    },
    ...customTheme,
  })
}

// 关闭加载
export const closeLoading = () => {
  Swal.close()
}

// 输入对话框
export const showInput = (title: string, inputPlaceholder = '', inputType: 'text' | 'email' | 'password' | 'number' = 'text') => {
  return Swal.fire({
    title,
    input: inputType,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputValidator: (value) => {
      if (!value) {
        return '请输入内容'
      }
    },
    ...customTheme,
  })
}

// Toast 提示
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
    ...customTheme,
  })
}

// 自定义HTML内容
export const showCustom = (html: string, title?: string) => {
  return Swal.fire({
    title,
    html,
    showCloseButton: true,
    showConfirmButton: false,
    ...customTheme,
  })
}

// 步骤式对话框
export const showSteps = async (steps: Array<{ title: string; text?: string; html?: string }>) => {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const result = await Swal.fire({
      title: step.title,
      text: step.text,
      html: step.html,
      showCancelButton: i > 0,
      confirmButtonText: i === steps.length - 1 ? '完成' : '下一步',
      cancelButtonText: '上一步',
      allowOutsideClick: false,
      ...customTheme,
    })

    if (result.dismiss === Swal.DismissReason.cancel && i > 0) {
      i -= 2 // 回到上一步
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      break // 取消整个流程
    }
  }
}

// 进度条对话框
export const showProgress = (title: string, initialProgress = 0) => {
  let progressBar: HTMLElement

  Swal.fire({
    title,
    html: `
      <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div id="progress-bar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: ${initialProgress}%"></div>
      </div>
      <div id="progress-text">${initialProgress}%</div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => {
      progressBar = document.getElementById('progress-bar')!
    },
    ...customTheme,
  })

  return {
    updateProgress: (progress: number) => {
      if (progressBar) {
        progressBar.style.width = `${progress}%`
        const progressText = document.getElementById('progress-text')
        if (progressText) {
          progressText.textContent = `${progress}%`
        }
      }
    },
    close: () => Swal.close(),
  }
}

export default Swal
